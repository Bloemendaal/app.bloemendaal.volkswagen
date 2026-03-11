import type { VehicleData } from "../vehicles/vag-vehicle.mjs";
import Vehicle from "../vehicles/volkswagen-vehicle.mjs";
import VagUser from "./vag-user.mjs";

export default class VolkswagenUser extends VagUser {
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
