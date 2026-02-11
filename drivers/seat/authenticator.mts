import * as crypto from "node:crypto";
import * as http from "node:http";
import * as https from "node:https";
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

// Seat specific endpoints
const BASE_URL = "https://ola.prod.code.seat.cloud.vwgroup.com";
const AUTH_BASE = "https://identity.vwgroup.io";
const TOKEN_REFRESH_URL = "https://tokenrefreshservice.apps.emea.vwapps.io";

// Seat client configuration
const CLIENT_ID = "99a5b77d-bd88-4d53-b4e5-a539c60694a3@apps_vw-dilab_com";
const REDIRECT_URI = "seat://oauth-callback";
const SCOPE = "openid profile nickname birthdate phone";
const MAXIMUM_REDIRECTS = 10;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // 1 minute

interface SeatTokenResponse {
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

export default class SeatAuthenticator implements Authenticatable {
	private readonly credentials: Credentials;
	private readonly brand: "cupra" | "seat";

	private sPin: string | null = null;
	private tokenStore: TokenStore | null = null;

	private readonly authenticationClient: AxiosInstance;
	private readonly settingsUpdateCallbacks: SettingsUpdateCallback[] = [];

	constructor(configuration: Configuration & { brand?: "cupra" | "seat" }) {
		this.credentials = configuration.credentials;
		this.brand = configuration.brand ?? "cupra";

		this.sPin = configuration.sPin ?? null;
		this.tokenStore = configuration.tokenStore ?? null;

		this.authenticationClient = wrapper(
			axios.create({
				maxRedirects: 0,
				jar: new CookieJar(),
				withCredentials: true,
				validateStatus: (status) => status < 600,
				timeout: 30000,
			}),
		);
	}

	public setSPin(sPin: string | null = null): void {
		this.sPin = sPin || null;
	}

	public static fromSettings(
		settings: Partial<AuthSettings> & { brand?: "cupra" | "seat" },
	): SeatAuthenticator {
		const {
			sPin = "",
			email = "",
			password = "",
			idToken,
			accessToken,
			expiresAt,
			refreshToken,
			brand = "seat",
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

		return new SeatAuthenticator({
			sPin,
			tokenStore,
			brand,
			credentials: {
				email,
				password,
			},
		});
	}

	public async getSettings(): Promise<AuthSettings & { brand: string }> {
		const tokenStore = await this.authenticate();

		return {
			sPin: this.sPin,
			brand: this.brand,
			...this.credentials,
			...tokenStore,
		};
	}

	public onSettingsUpdate(callback: SettingsUpdateCallback): void {
		this.settingsUpdateCallbacks.push(callback);
	}

	public getConfiguration(): Configuration & { brand: string } {
		return {
			sPin: this.sPin,
			brand: this.brand,
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
			return null;
		}
	}

	public async getClient(): Promise<AxiosInstance> {
		const tokenStore = await this.authenticate();
		const userId = this.getUserId();

		if (!userId) {
			throw new Error("Failed to get user ID from authentication token");
		}

		return axios.create({
			baseURL: BASE_URL,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${tokenStore.accessToken}`,
				"User-Agent": "okhttp/3.14.7",
				"user-id": userId,
			},
			httpAgent: new http.Agent({ family: 4 }),
			httpsAgent: new https.Agent({ family: 4 }),
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
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let verifier = "";
		for (let i = 0; i < 16; i++) {
			verifier += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return verifier;
	}

	private generateCodeChallenge(verifier: string): string {
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
		const refreshedToken = await this.tryRefreshToken();

		if (refreshedToken) {
			return refreshedToken;
		}

		const verifier = this.generateCodeVerifier();
		const codeChallenge = this.generateCodeChallenge(verifier);
		const identityAuthUrl = await this.getAuthorizationUrl(codeChallenge);
		const identityResponse =
			await this.followToIdentityProvider(identityAuthUrl);
		const emailResponse = await this.submitEmailForm(identityResponse);

		const { passwordUrl, formData } = this.parsePasswordFormData(emailResponse);

		const code = await this.submitPasswordAndFollowRedirects(
			passwordUrl,
			formData,
		);

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
			const params = new URLSearchParams({
				brand: this.brand,
				grant_type: "refresh_token",
				refresh_token: this.tokenStore.refreshToken,
			});

			const tokenResponse = await axios.post<{
				access_token: string;
				id_token: string;
				refresh_token: string;
			}>(`${TOKEN_REFRESH_URL}/refreshTokens`, params.toString(), {
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json",
					"User-Agent": "okhttp/3.14.7",
				},
				timeout: 15000,
			});

			const expiresAt = this.decodeJwtExpiration(
				tokenResponse.data.access_token,
			);

			return {
				expiresAt,
				idToken: tokenResponse.data.id_token,
				accessToken: tokenResponse.data.access_token,
				refreshToken: tokenResponse.data.refresh_token,
			};
		} catch (error) {
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
						"User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
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
				form = $("form").first();
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

				if (redirectUrl.includes("/consent/marketing/")) {
					const response = await this.authenticationClient.get(redirectUrl);

					const $ = cheerio.load(response.data);
					const consentForm = $("form").first();

					if (consentForm.length > 0) {
						const consentFormData: Record<string, string> = {};

						consentForm.find("input").each((_i, elem) => {
							const name = $(elem).attr("name");
							const value = $(elem).attr("value") || "";

							if (name) {
								consentFormData[name] = value;
							}
						});

						// Set consent checkboxes to false (opt-out)
						if (consentFormData["marketingConsent"] !== undefined) {
							consentFormData["marketingConsent"] = "false";
						}

						const consentAction = consentForm.attr("action");
						const consentUrl = consentAction?.startsWith("http")
							? consentAction
							: `${AUTH_BASE}${consentAction}`;

						const consentResponse = await this.authenticationClient.post(
							consentUrl,
							new URLSearchParams(consentFormData).toString(),
							{
								headers: {
									"Content-Type": "application/x-www-form-urlencoded",
								},
							},
						);

						redirectUrl = consentResponse.headers.location;
						continue;
					}
				}

				// Handle terms and conditions page
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

			// Extract authorization code from URL
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
				state: code.substring(0, 10), // Use part of code as state
				id_token: code, // Python uses id_token from authorization response
				redirect_uri: REDIRECT_URI,
				client_id: CLIENT_ID,
				code: code,
				code_verifier: verifier,
				grant_type: "authorization_code",
			};

			const tokenResponse = await axios.post<{
				access_token: string;
				id_token: string;
				refresh_token: string;
			}>(
				`${BASE_URL}/authorization/api/v1/token`,
				new URLSearchParams(tokenBody as Record<string, string>).toString(),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
						Accept: "application/json",
					},
				},
			);

			const expiresAt = this.decodeJwtExpiration(
				tokenResponse.data.access_token,
			);
			return {
				expiresAt,
				idToken: tokenResponse.data.id_token,
				accessToken: tokenResponse.data.access_token,
				refreshToken: tokenResponse.data.refresh_token,
			};
		} catch (cause) {
			throw new TokenExchangeError({ cause });
		}
	}
}
