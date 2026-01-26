import * as crypto from "node:crypto";
import * as http from "node:http";
import * as https from "node:https";
import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import {
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

const BASE_URL = "https://ola.prod.code.seat.cloud.vwgroup.com";
const AUTH_BASE = "https://identity.vwgroup.io";
const TOKEN_REFRESH_URL = "https://tokenrefreshservice.apps.emea.vwapps.io";

const CLIENT_ID = "3c756d46-f1ba-4d78-9f9a-cff0d5292d51@apps_vw-dilab_com";
const REDIRECT_URI = "cupra://oauth-callback";
const SCOPE = "openid profile nickname birthdate phone";
const MAXIMUM_REDIRECTS = 10;
const TOKEN_EXPIRY_BUFFER_MS = 60 * 1000; // 1 minute

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

export default class CupraAuthenticator implements Authenticatable {
  private readonly credentials: Credentials;
  private readonly brand: "cupra";

  private sPin: string | null = null;
  private tokenStore: TokenStore | null = null;

  private readonly authenticationClient: AxiosInstance;
  private readonly settingsUpdateCallbacks: SettingsUpdateCallback[] = [];

  constructor(configuration: Configuration & { brand?: "cupra" }) {
    this.credentials = configuration.credentials;
    this.brand = "cupra";

    this.sPin = configuration.sPin ?? null;
    this.tokenStore = configuration.tokenStore ?? null;

    this.authenticationClient = wrapper(
      axios.create({
        maxRedirects: 0,
        jar: new CookieJar(),
        withCredentials: true,
        validateStatus: (status) => status < 600,
        timeout: 30000,
      })
    );
  }

  public setSPin(sPin: string | null = null): void {
    this.sPin = sPin || null;
  }

  public static fromSettings(
    settings: Partial<AuthSettings> & { brand?: "cupra" }
  ): CupraAuthenticator {
    const {
      sPin = "",
      email = "",
      password = "",
      idToken,
      accessToken,
      expiresAt,
      refreshToken,
      brand = "cupra",
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

    return new CupraAuthenticator({
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
        Buffer.from(parts[1], "base64url").toString("utf-8")
      );

      return payload.sub || null;
    } catch (error) {
      console.error("[Cupra Auth] Failed to extract userId from token:", error);
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
      Buffer.from(parts[1], "base64url").toString("utf-8")
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
    response: AxiosResponse
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

      console.log(
        `[Cupra Auth] Following redirect ${redirectCount + 1}: ${redirectUrl}`
      );

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
    console.log("[Cupra Auth] Starting authentication flow");

    // Step 0: Check the refresh token
    const refreshedToken = await this.tryRefreshToken();

    if (refreshedToken) {
      console.log("[Cupra Auth] Successfully refreshed token");
      return refreshedToken;
    }

    // Step 1: Generate PKCE verifier and challenge
    console.log("[Cupra Auth] Generating PKCE parameters");
    const verifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(verifier);

    // Step 2: Get authorization URL from identity provider
    console.log("[Cupra Auth] Getting authorization URL");
    const identityAuthUrl = await this.getAuthorizationUrl(codeChallenge);

    // Step 3: Follow to identity provider
    console.log("[Cupra Auth] Following to identity provider");
    const identityResponse = await this.followToIdentityProvider(
      identityAuthUrl
    );

    // Step 4: Parse email form
    console.log("[Cupra Auth] Submitting email form");
    const emailResponse = await this.submitEmailForm(identityResponse);

    // Step 5: Parse password form (from JavaScript in page)
    console.log("[Cupra Auth] Parsing password form");
    const { passwordUrl, formData } = this.parsePasswordFormData(emailResponse);

    // Step 6: Submit password and extract authorization parameters
    console.log("[Cupra Auth] Submitting password and following redirects");
    const code = await this.submitPasswordAndFollowRedirects(
      passwordUrl,
      formData
    );

    // Step 7: Exchange for final tokens via Cupra API (like Skoda does)
    console.log("[Cupra Auth] Exchanging code for tokens");
    return await this.exchangeForFinalTokens({
      code,
      verifier,
    });
  }

  private async tryRefreshToken(): Promise<TokenStore | null> {
    if (!this.tokenStore?.refreshToken) {
      console.log("[Cupra Auth] No refresh token available");
      return null;
    }

    try {
      console.log("[Cupra Auth] Attempting token refresh");
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
        tokenResponse.data.access_token
      );

      return {
        expiresAt,
        idToken: tokenResponse.data.id_token,
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
      };
    } catch (error) {
      console.error("[Cupra Auth] Token refresh failed:", error);
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
      console.log(
        "[Cupra Auth] Authorization URL generated: " + authorizationUrl
      );

      return authorizationUrl;
    } catch (error) {
      throw new AuthorizationUrlError({ cause: error });
    }
  }

  private async followToIdentityProvider(
    identityAuthUrl: string
  ): Promise<AxiosResponse> {
    try {
      console.log("[Cupra Auth] Requesting identity provider page");
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

      console.log(
        `[Cupra Auth] Identity provider response received, status: ${identityResponse.status}`
      );
      return identityResponse;
    } catch (cause) {
      console.error(
        "[Cupra Auth] Error following to identity provider:",
        cause
      );
      if (axios.isAxiosError(cause)) {
        console.error("[Cupra Auth] Response status:", cause.response?.status);
        console.error(
          "[Cupra Auth] Response data:",
          JSON.stringify(cause.response?.data)
        );
      }
      throw new IdentityProviderError({ cause });
    }
  }

  private async submitEmailForm(
    identityResponse: AxiosResponse
  ): Promise<AxiosResponse> {
    try {
      console.log("[Cupra Auth] Parsing email form");
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
    emailResponse: AxiosResponse
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
    passwordFormData: Record<string, string>
  ): Promise<string> {
    try {
      console.log("[Cupra Auth] Submitting password");
      const passwordResponse = await this.authenticationClient.post(
        passwordUrl,
        new URLSearchParams(passwordFormData).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        }
      );

      let redirectUrl: string | undefined = passwordResponse.headers.location;
      let redirectCount = 0;

      // Follow all redirects until we reach the app redirect
      while (
        redirectUrl &&
        !redirectUrl.startsWith(REDIRECT_URI) &&
        redirectCount < MAXIMUM_REDIRECTS
      ) {
        redirectCount++;
        console.log(
          `[Cupra Auth] Redirect ${redirectCount}: ${redirectUrl.substring(
            0,
            100
          )}...`
        );

        if (!redirectUrl.startsWith("http")) {
          redirectUrl = `${AUTH_BASE}${redirectUrl}`;
        }

        // Handle marketing consent page (specific to Cupra/Seat)
        if (redirectUrl.includes("/consent/marketing/")) {
          console.log("[Cupra Auth] Handling marketing consent page");
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
              }
            );

            redirectUrl = consentResponse.headers.location;
            continue;
          }
        }

        // Handle terms and conditions page
        if (redirectUrl.includes("terms-and-conditions")) {
          console.log("[Cupra Auth] Handling terms and conditions page");
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
              }
            );

            redirectUrl = response.headers.location;
            continue;
          }
        }

        const response = await this.authenticationClient.get(redirectUrl);
        redirectUrl = response.headers.location;
      }

      if (!redirectUrl || !redirectUrl.startsWith(REDIRECT_URI)) {
        console.error(
          "[Cupra Auth] Failed to get authorization code. Last URL:",
          redirectUrl
        );
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

      console.log("[Cupra Auth] Authorization code obtained");
      return code;
    } catch (cause) {
      console.error("[Cupra Auth] Error in password submission:", cause);
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

      console.log("[Cupra Auth] Exchanging tokens via Identity Provider");

      // Cupra uses identity provider endpoint with client_secret (different from SEAT)
      const tokenBody = {
        state: code.substring(0, 10),
        id_token: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret:
          "eb8814e641c81a2640ad62eeccec11c98effc9bccd4269ab7af338b50a94b3a2",
        code: code,
        code_verifier: verifier,
        grant_type: "authorization_code",
      };

      const tokenResponse = await axios.post<{
        access_token: string;
        id_token: string;
        refresh_token: string;
      }>(
        `${AUTH_BASE}/oidc/v1/token`,
        new URLSearchParams(tokenBody as Record<string, string>).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            Accept: "application/json",
          },
        }
      );

      const expiresAt = this.decodeJwtExpiration(
        tokenResponse.data.access_token
      );

      console.log("[Cupra Auth] Token exchange successful");

      return {
        expiresAt,
        idToken: tokenResponse.data.id_token,
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
      };
    } catch (cause) {
      console.error("[Cupra Auth] Token exchange failed:", cause);
      if (axios.isAxiosError(cause)) {
        console.error(
          "[Cupra Auth] Token exchange response:",
          cause.response?.data
        );
      }
      throw new TokenExchangeError({ cause });
    }
  }
}
