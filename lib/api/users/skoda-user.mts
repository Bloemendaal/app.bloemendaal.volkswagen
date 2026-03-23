import SkodaVehicle from "../vehicles/skoda-vehicle.mjs";
import type { VehicleData } from "../vehicles/vag-vehicle.mjs";
import VagUser from "./vag-user.mjs";

export default class SkodaUser extends VagUser {
	public async verifySPin(): Promise<boolean> {
		const configuration = this.authenticator.getConfiguration();

		if (!configuration.sPin) {
			return false;
		}

		const client = await this.authenticator.getClient();

		try {
			const response = await client.post("/api/v1/spin/verify", {
				spin: configuration.sPin,
			});

			return response.status === 200 || response.status === 204;
		} catch {
			return false;
		}
	}

	public async getVehicles(): Promise<SkodaVehicle[]> {
		const client = await this.authenticator.getClient();

		const response = await client.get<{ vehicles: VehicleData[] }>(
			"/api/v1/garage/vehicles",
		);

		return response.data.vehicles.map(
			(data) => new SkodaVehicle(data, this.authenticator),
		);
	}
}
