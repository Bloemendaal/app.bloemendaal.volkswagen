import type { AuthSettings } from "./authenticatable.mjs";
import SeatCupraAuthenticator from "./seatcupra-authenticator.mjs";

export default class SeatAuthenticator extends SeatCupraAuthenticator {
	protected getClientId(): string {
		return "99a5b77d-bd88-4d53-b4e5-a539c60694a3@apps_vw-dilab_com";
	}

	protected getClientSecret(): string | null {
		return null;
	}

	protected getRedirectUri(): string {
		return "seat://oauth-callback";
	}

	protected getBaseUrl(): string {
		return "https://ola.prod.code.seat.cloud.vwgroup.com";
	}

	protected getAuthBaseUrl(): string {
		return "https://identity.vwgroup.io";
	}

	protected getTokenEndpoint(): string {
		return `${this.getBaseUrl()}/authorization/api/v1/token`;
	}

	protected getTokenRefreshEndpoint(): string {
		return "https://tokenrefreshservice.apps.emea.vwapps.io/refreshTokens";
	}

	protected getBrand(): string {
		return "seat";
	}

	public static fromSettings(
		settings: Partial<AuthSettings>,
	): SeatAuthenticator {
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

		return new SeatAuthenticator({
			sPin,
			tokenStore,
			credentials: {
				email,
				password,
			},
		});
	}
}
