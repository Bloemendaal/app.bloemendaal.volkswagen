import type { AuthSettings } from "./authenticatable.mjs";
import SeatCupraAuthenticator from "./seatcupra-authenticator.mjs";

export default class CupraAuthenticator extends SeatCupraAuthenticator {
	protected getClientId(): string {
		return "3c756d46-f1ba-4d78-9f9a-cff0d5292d51@apps_vw-dilab_com";
	}

	protected getClientSecret(): string | null {
		return "eb8814e641c81a2640ad62eeccec11c98effc9bccd4269ab7af338b50a94b3a2";
	}

	protected getRedirectUri(): string {
		return "cupra://oauth-callback";
	}

	protected getBaseUrl(): string {
		return "https://ola.prod.code.seat.cloud.vwgroup.com";
	}

	protected getAuthBaseUrl(): string {
		return "https://identity.vwgroup.io";
	}

	protected getTokenEndpoint(): string {
		return `${this.getAuthBaseUrl()}/oidc/v1/token`;
	}

	protected getTokenRefreshEndpoint(): string {
		return "https://tokenrefreshservice.apps.emea.vwapps.io/refreshTokens";
	}

	protected getBrand(): string {
		return "cupra";
	}

	public static fromSettings(
		settings: Partial<AuthSettings>,
	): CupraAuthenticator {
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

		return new CupraAuthenticator({
			sPin,
			tokenStore,
			credentials: {
				email,
				password,
			},
		});
	}
}
