import TranslatableError from "../errors/translatable-error.mjs";
import Authenticatable, { type AuthSettings } from "./authenticatable.mjs";
import Vehicle, { type VehicleData } from "./vehicle.mjs";

interface Translator {
	__(key: string | object, tags?: object | undefined): string;
}

export default class User extends Authenticatable {
	public async canLogin(translator: Translator): Promise<boolean> {
		try {
			await this.authenticate();
		} catch (error) {
			if (error instanceof TranslatableError) {
				throw new Error(translator.__(error.translationKey), {
					cause: error,
				});
			}

			return false;
		}

		return true;
	}

	public async verifySPin(): Promise<boolean> {
		if (!this.configuration.sPin) {
			return false;
		}

		const client = await this.getClient();

		const response = await client.post("/vehicle/v1/spin/verify", {
			spin: this.configuration.sPin,
		});

		return response.status === 204;
	}

	public async getVehicles(): Promise<Vehicle[]> {
		const client = await this.getClient();
		const response = await client.get<{ data: VehicleData[] }>(
			"/vehicle/v1/vehicles",
		);

		return response.data.data.map(
			(data) => new Vehicle(data, this.configuration),
		);
	}

	public static fromSettings(settings: Partial<AuthSettings>): User {
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

		return new User({
			sPin,
			tokenStore,
			credentials: {
				email,
				password,
			},
		});
	}
}
