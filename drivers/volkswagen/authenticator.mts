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
	AuthorizationParametersError,
	AuthorizationUrlError,
	LoginFailedError,
	TokenExchangeError,
} from "#lib/errors/authentication-errors.mjs";

const REGION = "emea";
const BASE_URL = "https://emea.bff.cariad.digital";
const CLIENT_ID = "a24fba63-34b3-4d43-b181-942111e6bda8@apps_vw-dilab_com";
const REDIRECT_URI = "weconnect://authenticated";
const MAXIMUM_REDIRECTS = 10;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // 1 minute

interface TokenResponse {
	idToken: string;
	accessToken: string;
	refreshToken: string;
}

interface TokenRefresh {
	id_token: string;
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

interface AuthorizationParameters {
	code: string;
	returnedState: string;
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

  public getUserId(): string | null {
    if (!this.tokenStore?.accessToken) {
      return null;
    }

    try {
      const parts = this.tokenStore.accessToken.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf-8")
      );

      return payload.sub || null;
    } catch (error) {
      console.error(
        "[Volkswagen Auth] Failed to extract userId from token:",
        error
      );
      return null;
    }
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
				"User-Agent": "Volkswagen/3.51.1-android/14",
				"x-android-package-name": "com.volkswagen.weconnect",
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
		// Step 0: Check the refresh token
		const refreshedToken = await this.tryRefreshToken();

		if (refreshedToken) {
			return refreshedToken;
		}

		// Step 1: Get authorization URL from WeConnect
		const identityAuthUrl = await this.getAuthorizationUrl();

		// Step 2: Submit email and password forms
		const redirectUrl = await this.handleNewAuthFlow(identityAuthUrl);

		// Step 3: Extract parameters from redirect URL and exchange for tokens
		const tokenStore = this.extractAuthorizationParameters(redirectUrl);

		// Step 4: Exchange authorization parameters for final tokens
		return await this.exchangeForFinalTokens(tokenStore);
	}

	private async tryRefreshToken(): Promise<TokenStore | null> {
		if (!this.tokenStore?.refreshToken) {
			return null;
		}

		try {
			const tokenUrl = `${BASE_URL}/login/v1/idk/token`;

			const body = new URLSearchParams({
				client_id: CLIENT_ID,
				grant_type: "refresh_token",
				refresh_token: this.tokenStore.refreshToken,
			});

			const tokenResponse = await axios.post<TokenRefresh>(
				tokenUrl,
				body.toString(),
				{
					headers: {
						"Accept-Encoding": "gzip, deflate, br",
						Connection: "keep-alive",
						"Content-Type": "application/x-www-form-urlencoded",
						"User-Agent": "Volkswagen/3.51.1-android/14",
						"x-android-package-name": "com.volkswagen.weconnect",
					},
				},
			);

			const newTokens = tokenResponse.data;
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

	private async getAuthorizationUrl(): Promise<string> {
		try {
			const searchParams = new URLSearchParams({
				nonce: crypto.randomBytes(16).toString("hex"),
				redirect_uri: REDIRECT_URI,
			});

			const authorizationUrl = `${BASE_URL}/user-login/v1/authorize?${searchParams.toString()}`;

			const authorizationResponse = await this.authenticationClient.get(
				authorizationUrl,
				{
					maxRedirects: 0,
					validateStatus: (status) => status < 400,
				},
			);

			const identityAuthUrl: string | undefined =
				authorizationResponse.headers.location;

			if (authorizationResponse.status !== 303 || !identityAuthUrl) {
				throw new Error("Failed to get authorization URL from WeConnect");
			}

			return identityAuthUrl;
		} catch (error) {
			throw new AuthorizationUrlError({ cause: error });
		}
	}

	private async handleNewAuthFlow(url: string): Promise<string> {
		try {
			const response = await this.authenticationClient.get(url, {
				maxRedirects: MAXIMUM_REDIRECTS,
				headers: {
					Accept:
						"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				},
				validateStatus: (status) => status === 200,
			});

			// Extract state token using regex
			const stateMatch = response.data.match(
				/<input[^>]*name="state"[^>]*value="([^"]*)"/,
			);

			const state = stateMatch?.[1];

			if (!state) {
				throw new Error("Could not find state token in authorization page");
			}

			const loginForm = {
				state,
				username: this.credentials.email,
				password: this.credentials.password,
			};

			const loginUrl = `https://identity.vwgroup.io/u/login?state=${state}`;

			const loginResponse = await this.authenticationClient.post(
				loginUrl,
				new URLSearchParams(loginForm).toString(),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Accept:
							"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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

			for (let i = 0; i < 10 && !redirectUrl.startsWith(REDIRECT_URI); i++) {
				if (!redirectUrl.startsWith("http")) {
					redirectUrl = redirectUrl.startsWith("/")
						? `https://identity.vwgroup.io${redirectUrl}`
						: `https://identity.vwgroup.io/${redirectUrl}`;
				}

				const followResponse = await this.authenticationClient.get(
					redirectUrl,
					{
						maxRedirects: 0,
						validateStatus: (status) => status < 600,
					},
				);

				if (followResponse.status === 500) {
					throw new Error("Temporary server error during new auth flow");
				}

				if (!followResponse.headers.location) {
					throw new Error("No Location header in redirect");
				}

				redirectUrl = followResponse.headers.location;
			}

			return redirectUrl;
		} catch (cause) {
			throw new LoginFailedError({ cause });
		}
	}

	private extractAuthorizationParameters(
		redirectUrl: string,
	): AuthorizationParameters {
		try {
			const hashIndex = redirectUrl.indexOf("#");

			if (hashIndex === -1) {
				throw new Error("No parameters in redirect URL");
			}

			const fragment = redirectUrl.substring(hashIndex + 1);
			const params = new URLSearchParams(fragment);

			const code = params.get("code");
			const returnedState = params.get("state");
			const idToken = params.get("id_token");
			const accessToken = params.get("access_token");

			if (!code || !returnedState || !idToken || !accessToken) {
				throw new Error(
					"Missing code, state, id_token, or access_token in redirect URL",
				);
			}

			return { code, returnedState, idToken, accessToken };
		} catch (cause) {
			throw new AuthorizationParametersError({ cause });
		}
	}

	private async exchangeForFinalTokens({
		code,
		returnedState,
		idToken,
		accessToken,
	}: AuthorizationParameters): Promise<TokenStore> {
		try {
			const tokenBody = {
				state: returnedState,
				id_token: idToken,
				redirect_uri: REDIRECT_URI,
				region: REGION,
				access_token: accessToken,
				authorizationCode: code,
			};

			const tokenResponse = await axios.post<TokenResponse>(
				`${BASE_URL}/user-login/login/v1`,
				tokenBody,
				{
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						"User-Agent": "Volkswagen/3.51.1-android/14",
						"x-android-package-name": "com.volkswagen.weconnect",
					},
					validateStatus: (status) => status < 600,
				},
			);

			const expiresAt = JSON.parse(
				atob(tokenResponse.data.accessToken.split(".")[1]),
			).exp;

			const tokenStore = {
				expiresAt,
				idToken: tokenResponse.data.idToken,
				accessToken: tokenResponse.data.accessToken,
				refreshToken: tokenResponse.data.refreshToken,
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
