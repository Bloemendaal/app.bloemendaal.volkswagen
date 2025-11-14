import crypto from "node:crypto";
import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import {
	AuthorizationUrlError,
	EmailSubmissionError,
	IdentityProviderError,
	PasswordFormParseError,
	PasswordSubmissionError,
	TokenExchangeError,
} from "./errors/authentication-errors.mjs";

const REGION = "emea";
const BASE_URL = "https://emea.bff.cariad.digital";
const AUTH_BASE = "https://identity.vwgroup.io";
const CLIENT_ID = "a24fba63-34b3-4d43-b181-942111e6bda8@apps_vw-dilab_com";
const REDIRECT_URI = "weconnect://authenticated";
const MAXIMUM_REDIRECTS = 10;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // 1 minute

export interface Credentials {
	email: string;
	password: string;
}

export interface TokenStore {
	idToken: string;
	accessToken: string;
	refreshToken?: string;
	expiresAt: number;
}

export interface Configuration {
	credentials: Credentials;
	tokenStore?: TokenStore | null;
	sPin?: string | null;
}

interface TokenResponse {
	idToken: string;
	accessToken: string;
	refreshToken: string;
	accessTokenExpirationTime: number;
}

interface AuthorizationParameters {
	code: string;
	returnedState: string;
	idToken: string;
	accessToken: string;
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

export interface AuthSettings extends Credentials, TokenStore {
	sPin?: string | null;
}

type SettingsUpdateCallback = (settings: AuthSettings) => void;

export default abstract class Authenticatable {
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

	public async getSettings(): Promise<AuthSettings> {
		const tokenStore = await this.authenticate();

		return {
			sPin: this.sPin,
			...this.configuration.credentials,
			...tokenStore,
		};
	}

	public onSettingsUpdate(callback: SettingsUpdateCallback): void {
		this.settingsUpdateCallbacks.push(callback);
	}

	protected get configuration(): Configuration {
		return {
			sPin: this.sPin,
			credentials: this.credentials,
			tokenStore: this.tokenStore,
		};
	}

	protected async getClient(): Promise<AxiosInstance> {
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

		// Step 1: Get authorization URL from WeConnect
		const identityAuthUrl = await this.getAuthorizationUrl();

		// Step 2: Follow to identity provider
		const identityResponse =
			await this.followToIdentityProvider(identityAuthUrl);

		// Step 3: Parse email form
		const emailResponse = await this.submitEmailForm(identityResponse);

		// Step 4: Parse password form (from JavaScript in page)
		const { passwordUrl, formData } = this.parsePasswordFormData(emailResponse);

		// Step 5: Submit password and extract authorization parameters
		const tokens = await this.submitPasswordAndFollowRedirects(
			passwordUrl,
			formData,
		);

		// Step 6: Exchange for final tokens
		return await this.exchangeForFinalTokens(tokens);
	}

	private async tryRefreshToken(): Promise<TokenStore | null> {
		if (!this.tokenStore?.refreshToken) {
			return null;
		}

		try {
			const tokenResponse = await axios.get<TokenResponse>(
				`${BASE_URL}/user-login/refresh/v1`,
				{
					headers: {
						Accept: "application/json",
						Authorization: `Bearer ${this.tokenStore.refreshToken}`,
						"User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
					},
				},
			);

			const expiresAt =
				Math.floor(Date.now() / 1000) +
				tokenResponse.data.accessTokenExpirationTime;

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
	): Promise<AuthorizationParameters> {
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
					console.warn(
						"Terms and conditions detected, attempting to accept...",
					);

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
			const hashIndex = redirectUrl.indexOf("#");

			if (hashIndex === -1) {
				throw new Error(`No parameters in redirect URL.`);
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
			throw new PasswordSubmissionError({ cause });
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
						"X-Requested-With": "com.volkswagen.carnet.eu.eremote",
						"User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
					},
				},
			);

			const expiresAt =
				Math.floor(Date.now() / 1000) +
				tokenResponse.data.accessTokenExpirationTime;

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
