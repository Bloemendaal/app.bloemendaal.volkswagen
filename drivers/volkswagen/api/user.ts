import Authenticatable, {
	type Credentials,
	type TokenStore,
} from "./authenticatable.js";
import Vehicle, { type VehicleData } from "./vehicle.js";

type UserSettings = Credentials & TokenStore;

export default class User extends Authenticatable {
	public async canLogin(): Promise<boolean> {
		try {
			await this.authenticate();
		} catch {
			return false;
		}

		return true;
	}

	public async getSettings(): Promise<UserSettings> {
		const tokenStore = await this.authenticate();

		return {
			...this.configuration.credentials,
			...tokenStore,
		};
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

	public static fromSettings(settings: UserSettings): User {
		const { email, password, ...rest } = settings;

		const tokenStore =
			"accessToken" in rest && "idToken" in rest && "expiresAt" in rest
				? rest
				: null;

		return new User({
			tokenStore,
			credentials: {
				email,
				password,
			},
		});
	}
}
