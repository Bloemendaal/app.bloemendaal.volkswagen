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
// offline_access is part of the canonical app scope — confirmed in the scp claim
// of tokens issued by the live Auth0 server.
const SCOPE = "openid profile badge dealers cars vin offline_access";
const REDIRECT_URI = "weconnect://authenticated";
const MAXIMUM_REDIRECTS = 10;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // 1 minute
const USER_AGENT = "Volkswagen/3.61.0-android/14";
const ANDROID_PACKAGE = "com.volkswagen.weconnect";

interface TokenRefresh {
	id_token: string;
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	token_type: string;
}

interface OpenIdConfig {
	authorizationEndpoint: string;
	issuer: string;
}

interface CallbackTokens {
	code: string;
	idToken: string;
	accessToken: string;
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
		// Step 0: If we have a refresh_token from before the API change, try it.
		// The /auth/v1/idk/oidc/token refresh path doesn't require hardware
		// attestation, so previously-issued refresh_tokens still work — until
		// they expire or are revoked.
		const refreshed = await this.tryRefreshToken();

		if (refreshed) {
			return refreshed;
		}

		// Fallback: OIDC hybrid flow. The CARIAD BFF token-exchange endpoint
		// requires hardware-attested assertion headers that only the official
		// app can produce, so we use response_type=code id_token token and
		// have Auth0 return the id_token + access_token directly in the
		// callback URL — no server-side token exchange needed. Hybrid flow
		// does not return a refresh_token, so a full re-login is required
		// once the access_token expires (~2h).

		// Clear stale cookies so Auth0 doesn't replay an old transaction
		await this.authenticationClient.defaults.jar?.removeAllCookies();

		// Step 1: Fetch OpenID configuration
		const openIdConfig = await this.getOpenIdConfig();

		// Step 2: Direct to identity provider's authorize endpoint
		const loginPageUrl = await this.getAuthorizationUrl(
			openIdConfig.authorizationEndpoint,
		);

		// Step 3: Submit credentials, follow redirects, extract hybrid-flow tokens
		const callbackTokens = await this.handleNewAuthFlow(
			loginPageUrl,
			openIdConfig.issuer,
		);

		// Step 4: Build the session token store directly from the callback values
		return this.buildSessionTokens(callbackTokens);
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
						Accept: "application/json",
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
				refreshToken: newTokens.refresh_token ?? this.tokenStore.refreshToken,
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
			// Hybrid flow: Auth0 returns code + id_token + access_token in the
			// callback so no separate token exchange with the CARIAD BFF is needed.
			// nonce is required by Auth0 hybrid flow (embedded in the returned id_token).
			const searchParams = new URLSearchParams({
				redirect_uri: REDIRECT_URI,
				response_type: "code id_token token",
				client_id: CLIENT_ID,
				scope: SCOPE,
				nonce: crypto.randomBytes(16).toString("hex"),
			});

			const response = await this.authenticationClient.get(
				`${authorizationEndpoint}?${searchParams.toString()}`,
				{
					maxRedirects: 0,
					headers: {
						Connection: "keep-alive",
						Accept:
							"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
						"Accept-Encoding": "gzip, deflate",
						"Content-Type": "application/x-www-form-urlencoded",
						"User-Agent": USER_AGENT,
						"x-android-package-name": ANDROID_PACKAGE,
					},
					validateStatus: () => true,
				},
			);

			const loginPageUrl: string | undefined = response.headers.location;

			if (
				(response.status !== 302 && response.status !== 303) ||
				!loginPageUrl
			) {
				throw new Error(
					`Failed to get login page URL from authorization endpoint (status ${response.status})`,
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
	): Promise<CallbackTokens> {
		// Match the working Python HEADERS_AUTH exactly
		const authHeaders = {
			Connection: "keep-alive",
			Accept:
				"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
			"Accept-Encoding": "gzip, deflate",
			"Content-Type": "application/x-www-form-urlencoded",
			"User-Agent": USER_AGENT,
			"x-android-package-name": ANDROID_PACKAGE,
		};

		try {
			const loginPageResponse = await this.authenticationClient.get(
				loginPageUrl,
				{
					maxRedirects: 0,
					headers: authHeaders,
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

			const loginResponse = await this.authenticationClient.post(
				loginPageUrl,
				new URLSearchParams({
					state,
					username: this.credentials.email,
					password: this.credentials.password,
					// Required by Auth0 Universal Login to distinguish a credential
					// submission from other form actions (e.g. "Forgot password").
					action: "default",
				}).toString(),
				{
					headers: {
						...authHeaders,
						"Content-Type": "application/x-www-form-urlencoded",
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
						headers: authHeaders,
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

			// Hybrid flow returns parameters in the URL fragment, code flow in query.
			// Check both for code, id_token, and access_token.
			const callbackUrl = new URL(
				redirectUrl.replace("weconnect://", "https://weconnect-dummy/"),
			);
			const fragmentParams = new URLSearchParams(
				callbackUrl.hash.replace(/^#/, ""),
			);
			const pick = (key: string) =>
				callbackUrl.searchParams.get(key) ?? fragmentParams.get(key);

			const code = pick("code");
			const idToken = pick("id_token");
			const accessToken = pick("access_token");

			if (!code || !idToken || !accessToken) {
				throw new Error(
					"Missing code, id_token, or access_token in callback URL",
				);
			}

			return { code, idToken, accessToken };
		} catch (cause) {
			throw new LoginFailedError({ cause });
		}
	}

	private buildSessionTokens(tokens: CallbackTokens): TokenStore {
		try {
			// Hybrid flow does not return expires_in — pull it from the access_token JWT.
			const payload = JSON.parse(
				Buffer.from(tokens.accessToken.split(".")[1], "base64url").toString(
					"utf8",
				),
			) as { exp?: number };

			if (!payload.exp) {
				throw new Error("access_token JWT missing exp claim");
			}

			return {
				expiresAt: payload.exp,
				idToken: tokens.idToken,
				accessToken: tokens.accessToken,
			};
		} catch (cause) {
			throw new TokenExchangeError({ cause });
		}
	}
}
