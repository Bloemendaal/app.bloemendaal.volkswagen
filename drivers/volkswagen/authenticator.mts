import crypto from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import axios, { type AxiosInstance, type AxiosResponse } from "axios";
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
import IdKitPage, { IdKitStage } from "#lib/api/idkit-page.mjs";
import {
	AuthorizationUrlError,
	ConsentRequiredError,
	LoginFailedError,
	TokenExchangeError,
} from "#lib/errors/authentication-errors.mjs";
import TranslatableError from "#lib/errors/translatable-error.mjs";

const BASE_URL = "https://emea.bff.cariad.digital";
// offline_access is part of the canonical app scope — confirmed in the scp claim
// of tokens issued by the live Auth0 server.
const SCOPE = "openid profile badge dealers cars vin offline_access";
const MAXIMUM_REDIRECTS = 10;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // 1 minute
const USER_AGENT = "Volkswagen/3.61.0-android/14";
const ANDROID_PACKAGE = "com.volkswagen.weconnect";

// OAuth 2.0 device authorization flow on VW's identity provider. Unlike the app's
// own authorization code/hybrid flow, the device flow is meant for input-constrained
// clients, so it does not require the hardware-attested assertion headers that only
// the official app can produce. The browser half of the flow (entering credentials
// and approving the user code) is what we automate below.
const DEVICE_FLOW_BASE_URL = "https://identity.vwgroup.io";
const DEVICE_FLOW_CLIENT_ID =
	"650d46ca-2475-4384-85c2-6af3bf3d52f1@apps_vw-dilab_com";
const DEVICE_AUTHORIZATION_URL = `${DEVICE_FLOW_BASE_URL}/oidc/v1/device_authorization`;
const DEVICE_TOKEN_URL = `${DEVICE_FLOW_BASE_URL}/oidc/v1/token`;
const SIGNIN_SERVICE_URL = `${DEVICE_FLOW_BASE_URL}/signin-service/v1`;
const DEVICE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";

const DEFAULT_POLL_INTERVAL_SECONDS = 5;
const DEFAULT_POLL_EXPIRY_SECONDS = 330;
const SLOW_DOWN_INCREMENT_SECONDS = 5;
const TRANSIENT_POLL_STATUSES = new Set([429, 500, 502, 503, 504]);
const TRANSIENT_POLL_ERRORS = new Set([
	"temporarily_unavailable",
	"server_error",
]);

const BROWSER_HEADERS = {
	"User-Agent":
		"homey-volkswagen-auth/1.0 (+https://github.com/Bloemendaal/app.bloemendaal.volkswagen)",
	Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language": "en-US,en;q=0.5",
};
// Used as a fallback when VW refuses to serve the login pages to our own user agent.
const FALLBACK_BROWSER_HEADERS = {
	...BROWSER_HEADERS,
	"User-Agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0",
};

// A cold login walks all pages; when the identity provider still recognises our
// session cookies it drops us straight at the user code confirmation page.
const FULL_ROUTE: IdKitStage[] = [
	IdKitStage.Identifier,
	IdKitStage.Password,
	IdKitStage.Confirm,
	IdKitStage.Success,
];
const QUICK_ROUTE: IdKitStage[] = [IdKitStage.Confirm, IdKitStage.Success];

// Interstitials VW shows when the account still owes a consent decision, e.g.
// "marketConsent", "termsAndConditions" or "dataPrivacy" templates.
const CONSENT_STAGE_PATTERN = /consent|terms|privacy|legal/i;

// Errors VW reports as an `error` query parameter on the redirect after a step.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
	"validator.email.invalid": "The email address is not a valid Volkswagen ID",
	"login.errors.password_invalid": "Incorrect password",
	"login.error.throttled":
		"Too many failed login attempts — please wait before trying again",
	"login.error.locked": "Account locked after too many failed attempts",
	"login.error.blocked": "Login blocked by the VW identity service",
};

type BrowserHeaders = Record<string, string>;

interface TokenRefresh {
	id_token: string;
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	token_type: string;
}

interface DeviceAuthorization {
	deviceCode: string;
	verificationUri: string;
	intervalSeconds: number;
	expiresInSeconds: number;
}

interface PageResponse {
	status: number;
	url: string;
	data: unknown;
}

/** Values collected from the IDKit pages while walking the login route. */
interface IdKitState {
	csrfToken?: string;
	clientId?: string;
	relayState?: string;
	hmac?: string;
	userCode?: string;
	userId?: string;
	clientIdentityName?: string;
}

interface StageRequest {
	url: string;
	payload: Record<string, string>;
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
				validateStatus: () => true,
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
		// Step 0: A refresh token is cheaper than walking the login pages again.
		const refreshed = await this.tryRefreshToken();

		if (refreshed) {
			return refreshed;
		}

		// Step 1: Ask the identity provider for a device code and the URL a user
		// would normally open in a browser to approve it.
		const device = await this.startDeviceAuthorization();

		// Step 2: Play the part of that browser — log in and approve the user code.
		await this.approveDeviceCode(device.verificationUri);

		// Step 3: Collect the tokens the approval released.
		return await this.pollForTokens(device);
	}

	private async tryRefreshToken(): Promise<TokenStore | null> {
		if (!this.tokenStore?.refreshToken) {
			return null;
		}

		try {
			const body = new URLSearchParams({
				client_id: DEVICE_FLOW_CLIENT_ID,
				grant_type: "refresh_token",
				refresh_token: this.tokenStore.refreshToken,
			});

			const tokenResponse = await axios.post<TokenRefresh>(
				DEVICE_TOKEN_URL,
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

			return this.buildSessionTokens(
				tokenResponse.data,
				this.tokenStore.refreshToken,
			);
		} catch {
			return null;
		}
	}

	private async startDeviceAuthorization(): Promise<DeviceAuthorization> {
		try {
			const body = new URLSearchParams({
				client_id: DEVICE_FLOW_CLIENT_ID,
				scope: SCOPE,
			});

			const response = await axios.post(
				DEVICE_AUTHORIZATION_URL,
				body.toString(),
				{
					headers: {
						...BROWSER_HEADERS,
						Accept: "application/json",
						"Content-Type": "application/x-www-form-urlencoded",
					},
				},
			);

			const data = response.data ?? {};
			const deviceCode: unknown = data.device_code;
			const verificationUri: unknown =
				data.verification_uri_complete ?? data.verification_uri;

			if (
				typeof deviceCode !== "string" ||
				typeof verificationUri !== "string"
			) {
				throw new Error(
					"Device authorization response is missing the device code or verification URI",
				);
			}

			return {
				deviceCode,
				verificationUri,
				intervalSeconds: this.toSeconds(
					data.interval,
					DEFAULT_POLL_INTERVAL_SECONDS,
				),
				expiresInSeconds: this.toSeconds(
					data.expires_in,
					DEFAULT_POLL_EXPIRY_SECONDS,
				),
			};
		} catch (cause) {
			throw new AuthorizationUrlError({ cause });
		}
	}

	/**
	 * Walks the IDKit login pages the way a browser would: submit the email,
	 * submit the password, then confirm the device's user code.
	 */
	private async approveDeviceCode(verificationUri: string): Promise<void> {
		let landing: { page: IdKitPage; headers: BrowserHeaders } | null = null;
		let failure: unknown;

		// Retry the landing page with a browser user agent when VW does not serve
		// it to ours. Only safe before any credentials have been submitted.
		for (const headers of [BROWSER_HEADERS, FALLBACK_BROWSER_HEADERS]) {
			try {
				const page = await this.openVerificationPage(verificationUri, headers);

				landing = { page, headers };
				break;
			} catch (cause) {
				failure = cause;
				await this.authenticationClient.defaults.jar?.removeAllCookies();
			}
		}

		if (!landing) {
			throw new LoginFailedError({ cause: failure });
		}

		try {
			await this.walkLoginRoute(landing.page, landing.headers);
		} catch (cause) {
			console.error("Login failed:", cause);

			// Leave no half-finished transaction behind for the next attempt.
			await this.authenticationClient.defaults.jar?.removeAllCookies();

			throw cause instanceof TranslatableError
				? cause
				: new LoginFailedError({ cause });
		}
	}

	private async openVerificationPage(
		verificationUri: string,
		headers: BrowserHeaders,
	): Promise<IdKitPage> {
		const response = await this.request("get", verificationUri, headers);

		if (response.status >= 400) {
			throw new Error(
				`Failed to open the login page (status ${response.status})`,
			);
		}

		this.assertNoAuthError(response.url);

		return IdKitPage.fromHtml(response.data);
	}

	private async walkLoginRoute(
		landingPage: IdKitPage,
		headers: BrowserHeaders,
	): Promise<void> {
		const route = this.pickRoute(landingPage.stage);
		const state: IdKitState = {};

		let page = landingPage;

		// The last stage of a route is the confirmation page we only need to land on.
		for (let index = 0; index < route.length - 1; index++) {
			const stage = route[index];

			if (page.stage !== stage) {
				throw new Error(
					`Expected login stage "${stage}" but the page is "${page.stage}"`,
				);
			}

			this.collectStageValues(state, page, stage);

			const request = this.buildStageRequest(stage, state);
			const response = await this.request(
				"post",
				request.url,
				headers,
				request.payload,
			);

			if (response.status >= 400) {
				throw new Error(
					`Login stage "${stage}" failed with status ${response.status}`,
				);
			}

			this.assertNoAuthError(response.url);

			page = IdKitPage.fromHtml(response.data);

			const expected = route[index + 1];

			if (page.stage !== expected) {
				this.assertNotAwaitingConsent(page.stage);

				throw new Error(
					`Expected login stage "${expected}" after "${stage}" but got "${page.stage}"`,
				);
			}
		}
	}

	private pickRoute(stage: string): IdKitStage[] {
		if (stage === IdKitStage.Identifier) {
			return FULL_ROUTE;
		}

		if (stage === IdKitStage.Confirm) {
			return QUICK_ROUTE;
		}

		this.assertNotAwaitingConsent(stage);

		throw new Error(`Login started at an unexpected stage "${stage}"`);
	}

	/**
	 * VW interrupts the login with a consent page when the account has terms or
	 * privacy choices outstanding. Accepting those is the account holder's call,
	 * not ours, so the login stops with an actionable message instead.
	 */
	private assertNotAwaitingConsent(stage: string): void {
		if (!CONSENT_STAGE_PATTERN.test(stage)) {
			return;
		}

		throw new ConsentRequiredError({
			cause: new Error(
				`Volkswagen is asking for consent on the "${stage}" page`,
			),
		});
	}

	private collectStageValues(
		state: IdKitState,
		page: IdKitPage,
		stage: IdKitStage,
	): void {
		// The CSRF token and the relay state/hmac pair rotate on every page.
		state.csrfToken = this.require(page.csrfToken, "CSRF token", stage);
		state.relayState = this.require(page.relayState, "relay state", stage);
		state.hmac = this.require(page.hmac, "hmac", stage);

		if (stage === IdKitStage.Identifier) {
			state.clientId = this.require(page.clientId, "client id", stage);
		}

		if (stage === IdKitStage.Confirm) {
			state.clientId = this.require(page.clientId, "client id", stage);
			state.userCode = this.require(page.userCode, "user code", stage);
			state.userId = this.require(page.userId, "user id", stage);
			state.clientIdentityName = this.require(
				page.clientIdentityName,
				"client identity name",
				stage,
			);
		}
	}

	private buildStageRequest(
		stage: IdKitStage,
		state: IdKitState,
	): StageRequest {
		const clientId = state.clientId ?? DEVICE_FLOW_CLIENT_ID;
		const csrfToken = this.require(state.csrfToken, "CSRF token", stage);
		const relayState = this.require(state.relayState, "relay state", stage);
		const hmac = this.require(state.hmac, "hmac", stage);

		if (stage === IdKitStage.Identifier) {
			return {
				url: `${SIGNIN_SERVICE_URL}/${clientId}/login/identifier`,
				payload: {
					_csrf: csrfToken,
					relayState,
					hmac,
					email: this.credentials.email,
				},
			};
		}

		if (stage === IdKitStage.Password) {
			return {
				url: `${SIGNIN_SERVICE_URL}/${clientId}/login/authenticate`,
				payload: {
					_csrf: csrfToken,
					relayState,
					hmac,
					email: this.credentials.email,
					password: this.credentials.password,
				},
			};
		}

		if (stage === IdKitStage.Confirm) {
			const query = new URLSearchParams({
				relayState,
				user_id: this.require(state.userId, "user id", stage),
				hmac,
			});
			const userCode = this.require(state.userCode, "user code", stage);

			return {
				url: `${SIGNIN_SERVICE_URL}/device/${clientId}/${userCode}?${query.toString()}`,
				payload: {
					_csrf: csrfToken,
					client_identity_name: this.require(
						state.clientIdentityName,
						"client identity name",
						stage,
					),
					allow: "",
				},
			};
		}

		throw new Error(`Login stage "${stage}" cannot be submitted`);
	}

	private async pollForTokens(
		device: DeviceAuthorization,
	): Promise<TokenStore> {
		// The user code was already approved, so the first poll normally succeeds.
		// Stop shortly before the device code expires rather than waiting it out.
		const deadline =
			Date.now() + Math.max(device.expiresInSeconds - 5, 30) * 1000;

		let intervalSeconds = Math.max(device.intervalSeconds, 1);
		let lastError = "";

		while (Date.now() < deadline) {
			const body = new URLSearchParams({
				grant_type: DEVICE_GRANT_TYPE,
				device_code: device.deviceCode,
				client_id: DEVICE_FLOW_CLIENT_ID,
			});

			const response = await axios.post<
				Partial<TokenRefresh> & { error?: string }
			>(DEVICE_TOKEN_URL, body.toString(), {
				headers: {
					...BROWSER_HEADERS,
					Accept: "application/json",
					"Content-Type": "application/x-www-form-urlencoded",
				},
				validateStatus: () => true,
			});

			if (response.status === 200) {
				return this.buildSessionTokens(response.data);
			}

			const error =
				typeof response.data?.error === "string" ? response.data.error : "";

			lastError = error || `HTTP ${response.status}`;

			if (error === "slow_down") {
				intervalSeconds += SLOW_DOWN_INCREMENT_SECONDS;
			} else if (
				error !== "authorization_pending" &&
				!TRANSIENT_POLL_ERRORS.has(error) &&
				!TRANSIENT_POLL_STATUSES.has(response.status)
			) {
				throw new TokenExchangeError({
					cause: new Error(`Token request was rejected: ${lastError}`),
				});
			}

			await sleep(intervalSeconds * 1000);
		}

		throw new TokenExchangeError({
			cause: new Error(
				`Timed out waiting for tokens${lastError ? ` (last response: ${lastError})` : ""}`,
			),
		});
	}

	private buildSessionTokens(
		tokens: Partial<TokenRefresh>,
		fallbackRefreshToken?: string,
	): TokenStore {
		const { id_token: idToken, access_token: accessToken } = tokens;

		if (!idToken || !accessToken) {
			throw new TokenExchangeError({
				cause: new Error("Token response is missing the id or access token"),
			});
		}

		return {
			idToken,
			accessToken,
			refreshToken: tokens.refresh_token ?? fallbackRefreshToken,
			expiresAt: this.getExpiry(accessToken, tokens.expires_in),
		};
	}

	private getExpiry(accessToken: string, expiresIn?: number): number {
		if (typeof expiresIn === "number" && expiresIn > 0) {
			return Math.floor(Date.now() / 1000) + expiresIn;
		}

		try {
			const payload = JSON.parse(
				Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"),
			) as { exp?: number };

			if (payload.exp) {
				return payload.exp;
			}
		} catch {
			// Fall through to the error below.
		}

		throw new TokenExchangeError({
			cause: new Error("Could not determine when the access token expires"),
		});
	}

	/**
	 * Performs a request and follows redirects by hand, so cookies set along the
	 * way land in the jar and the final URL stays visible for error detection.
	 */
	private async request(
		method: "get" | "post",
		url: string,
		headers: BrowserHeaders,
		payload?: Record<string, string>,
	): Promise<PageResponse> {
		let response: AxiosResponse =
			method === "post"
				? await this.authenticationClient.post(
						url,
						new URLSearchParams(payload).toString(),
						{
							headers: {
								...headers,
								"Content-Type": "application/x-www-form-urlencoded",
							},
						},
					)
				: await this.authenticationClient.get(url, { headers });

		let currentUrl = url;

		for (let redirect = 0; redirect <= MAXIMUM_REDIRECTS; redirect++) {
			const location: string | undefined = response.headers.location;

			if (response.status < 300 || response.status >= 400 || !location) {
				return {
					status: response.status,
					url: currentUrl,
					data: response.data,
				};
			}

			if (redirect === MAXIMUM_REDIRECTS) {
				break;
			}

			currentUrl = new URL(location, currentUrl).toString();
			response = await this.authenticationClient.get(currentUrl, { headers });
		}

		throw new Error(`Too many redirects while requesting ${url}`);
	}

	private assertNoAuthError(url: string): void {
		const error = new URL(url).searchParams.get("error");

		if (!error) {
			return;
		}

		throw new Error(
			AUTH_ERROR_MESSAGES[error] ?? `Authentication was rejected: ${error}`,
		);
	}

	private require(
		value: string | null | undefined,
		field: string,
		stage: IdKitStage,
	): string {
		if (!value) {
			throw new Error(`Login stage "${stage}" is missing the ${field}`);
		}

		return value;
	}

	private toSeconds(value: unknown, fallback: number): number {
		const seconds = typeof value === "number" ? value : Number(value);

		return Number.isFinite(seconds) && seconds > 0 ? seconds : fallback;
	}
}
