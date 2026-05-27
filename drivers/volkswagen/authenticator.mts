import crypto from "node:crypto";
import axios, { type AxiosInstance } from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import type {
	Authenticatable,
	AuthSettings,
	Configuration,
	Credentials,
	SettingsUpdateCallback,
	TokenStore,
} from "#lib/api/authenticatable.mjs";
import {
	AuthorizationUrlError,
	LoginFailedError,
	TokenExchangeError,
} from "#lib/errors/authentication-errors.mjs";

const BASE_URL = "https://emea.bff.cariad.digital";
const CLIENT_ID = "a24fba63-34b3-4d43-b181-942111e6bda8@apps_vw-dilab_com";
const SCOPE = "openid profile badge dealers cars vin";
const REDIRECT_URI = "weconnect://authenticated";
const MAXIMUM_REDIRECTS = 10;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // 1 minute
const USER_AGENT = "Volkswagen/3.61.0-android/14";
const ANDROID_PACKAGE = "com.volkswagen.weconnect";

interface TokenRefresh {
	id_token: string;
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

interface OpenIdConfig {
	authorizationEndpoint: string;
	tokenEndpoint: string;
	issuer: string;
}

export default class VolkswagenAuthenticator implements Authenticatable {
	private readonly credentials: Credentials;

	private sPin: string | null = null;
	private tokenStore: TokenStore | null = null;

	private readonly authenticationClient: AxiosInstance;
	private readonly settingsUpdateCallbacks: SettingsUpdateCallback[] = [];

	constructor(configuration: Configuration) {
		this.credentials = configuration.credentials;

		this.sPin = configuration.sPin ?? null;
		this.tokenStore = configuration.tokenStore ?? null;

		this.authenticationClient = wrapper(
			axios.create({
				maxRedirects: 0,
				jar: new CookieJar(),
				withCredentials: true,
				validateStatus: (status) => status < 600,
			}),
		);
	}

	public setSPin(sPin: string | null = null): void {
		this.sPin = sPin || null;
	}

	public static fromSettings(
		settings: Partial<AuthSettings>,
	): VolkswagenAuthenticator {
		const {
			sPin = "",
			email = "",
			password = "",
			idToken,
			accessToken,
			expiresAt,
			refreshToken,
		} = settings;

		const tokenStore =
			accessToken && expiresAt && idToken
				? {
						idToken,
						accessToken,
						refreshToken,
						expiresAt,
					}
				: null;

		return new VolkswagenAuthenticator({
			sPin,
			tokenStore,
			credentials: {
				email,
				password,
			},
		});
	}

	public async getSettings(): Promise<AuthSettings> {
		const tokenStore = await this.authenticate();

		return {
			sPin: this.sPin,
			...this.credentials,
			...tokenStore,
		};
	}

	public onSettingsUpdate(callback: SettingsUpdateCallback): void {
		this.settingsUpdateCallbacks.push(callback);
	}

	public getConfiguration(): Configuration {
		return {
			sPin: this.sPin,
			credentials: this.credentials,
			tokenStore: this.tokenStore,
		};
	}

	public async getClient(): Promise<AxiosInstance> {
		const tokenStore = await this.authenticate();

		return axios.create({
			baseURL: BASE_URL,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${tokenStore.accessToken}`,
				"weconnect-trace-id": crypto.randomUUID(),
				"User-Agent": USER_AGENT,
				"x-android-package-name": ANDROID_PACKAGE,
			},
		});
	}

	private async authenticate(): Promise<TokenStore> {
		if (this.tokenStore?.accessToken && !this.isTokenExpired()) {
			return this.tokenStore;
		}

		this.tokenStore = await this.authenticateWithCredentials();

		for (const callback of this.settingsUpdateCallbacks) {
			callback({
				...this.credentials,
				...this.tokenStore,
			});
		}

		return this.tokenStore;
	}

	private isTokenExpired(): boolean {
		if (!this.tokenStore?.expiresAt) {
			return true;
		}

		const now = Date.now();
		const expiresAt = this.tokenStore.expiresAt * 1000;

		return expiresAt - now < TOKEN_EXPIRY_BUFFER_MS;
	}

	private async authenticateWithCredentials(): Promise<TokenStore> {
		// Step 0: Try to refresh existing token
		const refreshedToken = await this.tryRefreshToken();
		if (refreshedToken) return refreshedToken;

		// Step 1: Fetch OpenID configuration to get live endpoints
		const openIdConfig = await this.getOpenIdConfig();

		// Step 2: Hit the authorization endpoint to get the login page URL
		const loginPageUrl = await this.getAuthorizationUrl(
			openIdConfig.authorizationEndpoint,
		);

		// Step 3: Submit credentials and follow redirects to get the auth code
		const authCode = await this.handleNewAuthFlow(
			loginPageUrl,
			openIdConfig.issuer,
		);

		// Step 4: Exchange the authorization code for tokens
		return await this.exchangeForFinalTokens(
			authCode,
			openIdConfig.tokenEndpoint,
		);
	}

	private async tryRefreshToken(): Promise<TokenStore | null> {
		if (!this.tokenStore?.refreshToken) {
			return null;
		}

		try {
			const body = new URLSearchParams({
				client_id: CLIENT_ID,
				grant_type: "refresh_token",
				refresh_token: this.tokenStore.refreshToken,
			});

			const tokenResponse = await axios.post<TokenRefresh>(
				`${BASE_URL}/auth/v1/idk/oidc/token`,
				body.toString(),
				{
					headers: {
						"Accept-Encoding": "gzip, deflate, br",
						Connection: "keep-alive",
						"Content-Type": "application/x-www-form-urlencoded",
						"User-Agent": USER_AGENT,
						"x-android-package-name": ANDROID_PACKAGE,
					},
				},
			);

			const newTokens = tokenResponse.data;
			if (!newTokens.access_token) return null;

			const expiresAt = Math.floor(Date.now() / 1000) + newTokens.expires_in;

			return {
				expiresAt,
				idToken: newTokens.id_token,
				accessToken: newTokens.access_token,
				refreshToken: newTokens.refresh_token,
			};
		} catch {
			return null;
		}
	}

	private async getOpenIdConfig(): Promise<OpenIdConfig> {
		try {
			const response = await this.authenticationClient.get(
				`${BASE_URL}/auth/v1/idk/oidc/openid-configuration`,
			);

			return {
				authorizationEndpoint: response.data.authorization_endpoint,
				tokenEndpoint: response.data.token_endpoint,
				issuer: response.data.issuer,
			};
		} catch (error) {
			throw new AuthorizationUrlError({ cause: error });
		}
	}

	private async getAuthorizationUrl(
		authorizationEndpoint: string,
	): Promise<string> {
		try {
			const searchParams = new URLSearchParams({
				client_id: CLIENT_ID,
				scope: SCOPE,
				response_type: "code",
				nonce: crypto.randomBytes(16).toString("hex"),
				redirect_uri: REDIRECT_URI,
			});

			const response = await this.authenticationClient.get(
				`${authorizationEndpoint}?${searchParams.toString()}`,
				{
					maxRedirects: 0,
					headers: {
						Accept:
							"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
						"User-Agent": USER_AGENT,
						"x-android-package-name": ANDROID_PACKAGE,
					},
					validateStatus: (status) => status < 400,
				},
			);

			const loginPageUrl: string | undefined = response.headers.location;

			if (
				(response.status !== 302 && response.status !== 303) ||
				!loginPageUrl
			) {
				throw new Error(
					"Failed to get login page URL from authorization endpoint",
				);
			}

			return loginPageUrl.startsWith("http")
				? loginPageUrl
				: new URL(loginPageUrl, authorizationEndpoint).toString();
		} catch (error) {
			throw new AuthorizationUrlError({ cause: error });
		}
	}

	private async handleNewAuthFlow(
		loginPageUrl: string,
		issuer: string,
	): Promise<string> {
		try {
			const loginPageResponse = await this.authenticationClient.get(
				loginPageUrl,
				{
					maxRedirects: 0,
					headers: {
						Accept:
							"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
						"User-Agent": USER_AGENT,
						"x-android-package-name": ANDROID_PACKAGE,
					},
					validateStatus: (status) => status === 200,
				},
			);

			const stateMatch = loginPageResponse.data.match(
				/<input[^>]*name="state"[^>]*value="([^"]*)"/,
			);
			const state = stateMatch?.[1];

			if (!state) {
				throw new Error("Could not find state token in login page");
			}

			const loginUrl = `${issuer}/u/login?state=${state}`;

			const loginResponse = await this.authenticationClient.post(
				loginUrl,
				new URLSearchParams({
					state,
					username: this.credentials.email,
					password: this.credentials.password,
				}).toString(),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Accept:
							"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
						"User-Agent": USER_AGENT,
						"x-android-package-name": ANDROID_PACKAGE,
						Origin: issuer,
						Referer: loginUrl,
					},
					maxRedirects: 0,
					validateStatus: (status) => status < 400,
				},
			);

			if (loginResponse.status !== 302 && loginResponse.status !== 303) {
				throw new Error(
					`Login failed with status code: ${loginResponse.status}`,
				);
			}

			if (!loginResponse.headers.location) {
				throw new Error("No Location header in login response");
			}

			let redirectUrl = loginResponse.headers.location;

			for (
				let i = 0;
				i < MAXIMUM_REDIRECTS && !redirectUrl.startsWith(REDIRECT_URI);
				i++
			) {
				if (!redirectUrl.startsWith("http")) {
					redirectUrl = redirectUrl.startsWith("/")
						? `${issuer}${redirectUrl}`
						: `${issuer}/${redirectUrl}`;
				}

				const followResponse = await this.authenticationClient.get(
					redirectUrl,
					{
						maxRedirects: 0,
						headers: {
							"User-Agent": USER_AGENT,
							"x-android-package-name": ANDROID_PACKAGE,
						},
						validateStatus: (status) => status < 600,
					},
				);

				if (followResponse.status === 500) {
					throw new Error("Temporary server error during auth flow");
				}

				if (!followResponse.headers.location) {
					throw new Error("No Location header in redirect");
				}

				redirectUrl = followResponse.headers.location;
			}

			// Extract code from query params (response_type=code flow returns ?code=...&state=...)
			const callbackUrl = new URL(
				redirectUrl.replace("weconnect://", "https://weconnect-dummy/"),
			);
			const code = callbackUrl.searchParams.get("code");

			if (!code) {
				throw new Error("No authorization code in callback URL");
			}

			return code;
		} catch (cause) {
			throw new LoginFailedError({ cause });
		}
	}

	private async exchangeForFinalTokens(
		authCode: string,
		tokenEndpoint: string,
	): Promise<TokenStore> {
		try {
			const body = new URLSearchParams({
				client_id: CLIENT_ID,
				grant_type: "authorization_code",
				code: authCode,
				redirect_uri: REDIRECT_URI,
			});

			const tokenResponse = await axios.post<TokenRefresh>(
				tokenEndpoint,
				body.toString(),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Accept: "application/json",
						"User-Agent": USER_AGENT,
						"x-android-package-name": ANDROID_PACKAGE,
					},
					validateStatus: (status) => status < 600,
				},
			);

			const expiresAt =
				Math.floor(Date.now() / 1000) + tokenResponse.data.expires_in;

			const tokenStore = {
				expiresAt,
				idToken: tokenResponse.data.id_token,
				accessToken: tokenResponse.data.access_token,
				refreshToken: tokenResponse.data.refresh_token,
			};

			if (!tokenStore.idToken || !tokenStore.accessToken) {
				throw new Error("Incomplete token data received from token exchange");
			}

			return tokenStore;
		} catch (cause) {
			throw new TokenExchangeError({ cause });
		}
	}
}
