import * as crypto from "node:crypto";
import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import type {
	Authenticatable,
	AuthSettings,
	Configuration,
	Credentials,
	SettingsUpdateCallback,
	TokenStore,
} from "../../lib/api/authenticatable.mjs";
import {
	AuthorizationUrlError,
	EmailSubmissionError,
	IdentityProviderError,
	PasswordFormParseError,
	PasswordSubmissionError,
	TokenExchangeError,
} from "../../lib/errors/authentication-errors.mjs";

const BASE_URL = "https://mysmob.api.connect.skoda-auto.cz";
const AUTH_BASE = "https://identity.vwgroup.io";
const CLIENT_ID = "7f045eee-7003-4379-9968-9355ed2adb06@apps_vw-dilab_com";
const REDIRECT_URI = "myskoda://redirect/login/";
const SCOPE =
	"address badge birthdate cars driversLicense dealers email mileage mbb nationalIdentifier openid phone profession vin";
const MAXIMUM_REDIRECTS = 10;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // 1 minute

interface SkodaTokenResponse {
	accessToken: string;
	idToken: string;
	refreshToken: string;
}

interface AuthorizationParameters {
	code: string;
	verifier: string;
}

interface PasswordFormData {
	passwordUrl: string;
	formData: {
		_csrf: string;
		relayState: string;
		hmac: string;
		email: string;
		password: string;
	};
}

export default class SkodaAuthenticator implements Authenticatable {
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
	): SkodaAuthenticator {
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

		return new SkodaAuthenticator({
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
				Buffer.from(parts[1], "base64url").toString("utf-8"),
			);

			return payload.sub || null;
		} catch (error) {
			console.error("[Skoda Auth] Failed to extract userId from token:", error);
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
			},
		});
	}

	protected async authenticate(): Promise<TokenStore> {
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

	private decodeJwtExpiration(token: string): number {
		const parts = token.split(".");

		if (parts.length !== 3) {
			throw new Error("Invalid JWT format");
		}

		const payload = JSON.parse(
			Buffer.from(parts[1], "base64url").toString("utf-8"),
		);

		if (!payload.exp) {
			throw new Error("No expiration claim in JWT");
		}

		return payload.exp;
	}

	private generateCodeVerifier(): string {
		// Generate a random 16-character verifier (matching Python implementation)
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let verifier = "";
		for (let i = 0; i < 16; i++) {
			verifier += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return verifier;
	}

	private generateCodeChallenge(verifier: string): string {
		// Create SHA256 hash of verifier and convert to base64url
		const hash = crypto.createHash("sha256").update(verifier).digest();
		return hash
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "");
	}

	private async followRedirects(
		response: AxiosResponse,
	): Promise<AxiosResponse> {
		for (
			let redirectCount = 0;
			response.headers.location && redirectCount < MAXIMUM_REDIRECTS;
			redirectCount++
		) {
			let redirectUrl: string | undefined = response.headers.location;

			if (!redirectUrl?.startsWith("http")) {
				redirectUrl = `${AUTH_BASE}${redirectUrl}`;
			}

			response = await this.authenticationClient.get(redirectUrl, {
				headers: {
					Accept:
						"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				},
				maxRedirects: 0,
				validateStatus: (status) => status < 400,
			});
		}

		return response;
	}

	private async authenticateWithCredentials(): Promise<TokenStore> {
		// Step 0: Check the refresh token
		const refreshedToken = await this.tryRefreshToken();

		if (refreshedToken) {
			return refreshedToken;
		}

		// Step 1: Generate PKCE verifier and challenge
		const verifier = this.generateCodeVerifier();
		const codeChallenge = this.generateCodeChallenge(verifier);

		// Step 2: Get authorization URL from identity provider
		const identityAuthUrl = await this.getAuthorizationUrl(codeChallenge);

		// Step 3: Follow to identity provider
		const identityResponse =
			await this.followToIdentityProvider(identityAuthUrl);

		// Step 4: Parse email form
		const emailResponse = await this.submitEmailForm(identityResponse);

		// Step 5: Parse password form (from JavaScript in page)
		const { passwordUrl, formData } = this.parsePasswordFormData(emailResponse);

		// Step 6: Submit password and extract authorization parameters
		const code = await this.submitPasswordAndFollowRedirects(
			passwordUrl,
			formData,
		);

		// Step 7: Exchange for final tokens
		return await this.exchangeForFinalTokens({
			code,
			verifier,
		});
	}

	private async tryRefreshToken(): Promise<TokenStore | null> {
		if (!this.tokenStore?.refreshToken) {
			return null;
		}

		try {
			const body = JSON.stringify({
				token: this.tokenStore.refreshToken,
			});

			const tokenResponse = await axios.post<SkodaTokenResponse>(
				`${BASE_URL}/api/v1/authentication/refresh-token?tokenType=CONNECT`,
				body,
				{
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
						"User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
					},
				},
			);

			const expiresAt = this.decodeJwtExpiration(
				tokenResponse.data.accessToken,
			);

			return {
				expiresAt,
				idToken: tokenResponse.data.idToken,
				accessToken: tokenResponse.data.accessToken,
				refreshToken: tokenResponse.data.refreshToken,
			};
		} catch {
			return null;
		}
	}

	private async getAuthorizationUrl(codeChallenge: string): Promise<string> {
		try {
			const searchParams = new URLSearchParams({
				client_id: CLIENT_ID,
				redirect_uri: REDIRECT_URI,
				response_type: "code",
				scope: SCOPE,
				nonce: crypto.randomBytes(16).toString("hex"),
				prompt: "login",
				code_challenge: codeChallenge,
				code_challenge_method: "s256",
			});

			const authorizationUrl = `${AUTH_BASE}/oidc/v1/authorize?${searchParams.toString()}`;

			return authorizationUrl;
		} catch (error) {
			throw new AuthorizationUrlError({ cause: error });
		}
	}

	private async followToIdentityProvider(
		identityAuthUrl: string,
	): Promise<AxiosResponse> {
		try {
			const identityResponse = await this.authenticationClient
				.get(identityAuthUrl, {
					headers: {
						Accept:
							"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
						"Accept-Language": "en-US,en;q=0.9",
					},
					maxRedirects: 0,
					validateStatus: (status) => status < 400,
				})
				.then(this.followRedirects.bind(this));

			return identityResponse;
		} catch (cause) {
			throw new IdentityProviderError({ cause });
		}
	}

	private async submitEmailForm(
		identityResponse: AxiosResponse,
	): Promise<AxiosResponse> {
		try {
			const $ = cheerio.load(identityResponse.data);
			let form = $("#emailPasswordForm");

			if (form.length === 0) {
				form = $('form[name="emailPasswordForm"]').first();
			}

			if (form.length === 0) {
				form = $("form").first(); // Fallback to first form
			}

			if (form.length === 0) {
				throw new Error("Email form not found in response");
			}

			const emailFormData: Record<string, string> = {};

			form.find("input").each((_i, elem) => {
				const name = $(elem).attr("name");
				const value = $(elem).attr("value") || "";

				if (name) {
					emailFormData[name] = value;
				}
			});

			emailFormData.email = this.credentials.email;

			const emailAction = form.attr("action");
			const emailUrl = emailAction?.startsWith("http")
				? emailAction
				: `${AUTH_BASE}${emailAction}`;

			const emailResponse = await this.authenticationClient
				.post(emailUrl, new URLSearchParams(emailFormData).toString(), {
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Accept:
							"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
					},
				})
				.then(this.followRedirects.bind(this));

			return emailResponse;
		} catch (cause) {
			throw new EmailSubmissionError({ cause });
		}
	}

	private parsePasswordFormData(
		emailResponse: AxiosResponse,
	): PasswordFormData {
		try {
			const scriptContent = emailResponse.data;
			const templateMatch = scriptContent.match(/templateModel: ({.*?}),\n/s);
			const csrfMatch = scriptContent.match(/csrf_token: '([^']+)'/);

			if (!templateMatch || !csrfMatch) {
				throw new Error("Could not find templateModel or csrf_token in page.");
			}

			const templateModel = JSON.parse(templateMatch[1]);
			const csrfToken: string = csrfMatch[1];

			const formData = {
				_csrf: csrfToken,
				relayState: templateModel.relayState,
				hmac: templateModel.hmac,
				email: this.credentials.email,
				password: this.credentials.password,
			};

			const passwordAction = templateModel.postAction;
			const passwordUrl = `${AUTH_BASE}/signin-service/v1/${CLIENT_ID}/${passwordAction}`;

			return { passwordUrl, formData };
		} catch (error) {
			throw new PasswordFormParseError({ cause: error });
		}
	}

	private async submitPasswordAndFollowRedirects(
		passwordUrl: string,
		passwordFormData: Record<string, string>,
	): Promise<string> {
		try {
			const passwordResponse = await this.authenticationClient.post(
				passwordUrl,
				new URLSearchParams(passwordFormData).toString(),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Accept:
							"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
					},
				},
			);

			let redirectUrl: string | undefined = passwordResponse.headers.location;
			let redirectCount = 0;

			while (
				redirectUrl &&
				!redirectUrl.startsWith(REDIRECT_URI) &&
				redirectCount < MAXIMUM_REDIRECTS
			) {
				redirectCount++;

				if (!redirectUrl.startsWith("http")) {
					redirectUrl = `${AUTH_BASE}${redirectUrl}`;
				}

				if (redirectUrl.includes("terms-and-conditions")) {
					const response = await this.authenticationClient.get(redirectUrl);

					const $ = cheerio.load(response.data);
					const termsForm = $("form").first();

					if (termsForm.length > 0) {
						const termsFormData: Record<string, string> = {};

						termsForm.find("input").each((_i, elem) => {
							const name = $(elem).attr("name");
							const value = $(elem).attr("value") || "";

							if (name) {
								termsFormData[name] = value;
							}
						});

						const termsAction = termsForm.attr("action");
						const termsUrl = termsAction?.startsWith("http")
							? termsAction
							: `${AUTH_BASE}${termsAction}`;

						const response = await this.authenticationClient.post(
							termsUrl,
							new URLSearchParams(termsFormData).toString(),
							{
								headers: {
									"Content-Type": "application/x-www-form-urlencoded",
								},
							},
						);

						redirectUrl = response.headers.location;
						continue;
					}
				}

				const response = await this.authenticationClient.get(redirectUrl);

				redirectUrl = response.headers.location;
			}

			if (!redirectUrl || !redirectUrl.startsWith(REDIRECT_URI)) {
				throw new Error("Failed to get authorization code from redirects");
			}

			// Extract authorization parameters from URL
			const hashIndex = redirectUrl.indexOf("?");

			if (hashIndex === -1) {
				throw new Error(`No parameters in redirect URL.`);
			}

			const fragment = redirectUrl.substring(hashIndex + 1);
			const params = new URLSearchParams(fragment);

			const code = params.get("code");

			if (!code) {
				throw new Error("Missing code in redirect URL");
			}

			return code;
		} catch (cause) {
			throw new PasswordSubmissionError({ cause });
		}
	}

	private async exchangeForFinalTokens({
		code,
		verifier,
	}: AuthorizationParameters): Promise<TokenStore> {
		try {
			if (!verifier) {
				throw new Error("PKCE verifier is required for token exchange");
			}

			const tokenBody = {
				redirectUri: REDIRECT_URI,
				code: code,
				verifier: verifier,
			};

			const tokenResponse = await axios.post<SkodaTokenResponse>(
				`${BASE_URL}/api/v1/authentication/exchange-authorization-code?tokenType=CONNECT`,
				JSON.stringify(tokenBody),
				{
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						"User-Agent":
							"Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.185 Mobile Safari/537.36",
						"x-requested-with": "cz.skodaauto.connect",
					},
				},
			);

			const expiresAt = this.decodeJwtExpiration(
				tokenResponse.data.accessToken,
			);

			return {
				expiresAt,
				idToken: tokenResponse.data.idToken,
				accessToken: tokenResponse.data.accessToken,
				refreshToken: tokenResponse.data.refreshToken,
			};
		} catch (cause) {
			throw new TokenExchangeError({ cause });
		}
	}
}
