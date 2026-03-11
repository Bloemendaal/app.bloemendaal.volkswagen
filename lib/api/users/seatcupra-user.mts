import SeatCupraVehicle from "../vehicles/seatcupra-vehicle.mjs";
import type { VehicleData } from "../vehicles/vag-vehicle.mjs";
import VagUser from "./vag-user.mjs";

export default class SeatCupraUser extends VagUser {
	public async verifySPin(): Promise<boolean> {
		const userId = this.authenticator.getUserId();
		const configuration = this.authenticator.getConfiguration();

		if (!configuration.sPin || !userId) {
			return false;
		}

		const client = await this.authenticator.getClient();

		const url = `/v2/users/${userId}/spin/verify`;
		const response = await client.post(url, {
			spin: configuration.sPin,
		});

		// TODO: verify this status, why is it 201 or 204?
		return response.status === 201 || response.status === 204;
	}

	public async getVehicles(): Promise<SeatCupraVehicle[]> {
		const client = await this.authenticator.getClient();
		const userId = this.authenticator.getUserId();

		if (!userId) {
			throw new Error("Failed to get user ID from authentication token");
		}

		const response = await client.get<{ vehicles: VehicleData[] }>(
			`/v2/users/${userId}/garage/vehicles`,
		);

		return response.data.vehicles.map(
			(data) => new SeatCupraVehicle(data, this.authenticator),
		);
	}
}
