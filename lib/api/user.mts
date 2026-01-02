import TranslatableError from "../errors/translatable-error.mjs";
import type { Authenticatable, AuthSettings } from "./authenticatable.mjs";
import Vehicle, { type VehicleData } from "./vehicle.mjs";

interface Translator {
	__(key: string | object, tags?: object | undefined): string;
}

export default class User {
	constructor(private readonly authenticator: Authenticatable) {}

	public getAuthenticator(): Authenticatable {
		return this.authenticator;
	}

	public async getSettings(): Promise<AuthSettings> {
		return await this.authenticator.getSettings();
	}

	public async canLogin(translator: Translator): Promise<boolean> {
		try {
			await this.authenticator.getClient();
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
		const configuration = this.authenticator.getConfiguration();

		if (!configuration.sPin) {
			return false;
		}

		const client = await this.authenticator.getClient();

		const response = await client.post("/vehicle/v1/spin/verify", {
			spin: configuration.sPin,
		});

		return response.status === 204;
	}

	public async getVehicles(): Promise<Vehicle[]> {
		const client = await this.authenticator.getClient();
		const response = await client.get<{ data: VehicleData[] }>(
			"/vehicle/v1/vehicles",
		);

		return response.data.data.map(
			(data) => new Vehicle(data, this.authenticator),
		);
	}
}
