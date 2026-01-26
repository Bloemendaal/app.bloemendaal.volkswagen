import type { VehicleData } from "../vehicles/base-vehicle.mjs";
import SeatCupraVehicle from "../vehicles/seatcupra-vehicle.mjs";
import BaseUser from "./base-user.mjs";

/**
 * SEAT/Cupra specific User class that uses the correct API endpoints
 * Based on SEAT/Cupra API documentation
 */
export default class SeatCupraUser extends BaseUser {
  public async verifySPin(userId: string): Promise<boolean> {
    const configuration = this.authenticator.getConfiguration();

    if (!configuration.sPin) {
      return false;
    }

    const client = await this.authenticator.getClient();
    try {
      const url = `/v2/users/${userId}/spin/verify`;
      const response = await client.post(url, {
        spin: configuration.sPin,
      });
      return response.status === 201 || response.status === 204;
    } catch (error) {
      throw error;
    }
  }

  public async getVehicles(): Promise<SeatCupraVehicle[]> {
    const client = await this.authenticator.getClient();
    const userId = this.authenticator.getUserId();

    if (!userId) {
      throw new Error("Failed to get user ID from authentication token");
    }

    try {
      const url = `/v2/users/${userId}/garage/vehicles`;
      const response = await client.get<{ vehicles: VehicleData[] }>(url);
      return response.data.vehicles.map(
        (data) => new SeatCupraVehicle(data, this.authenticator)
      );
    } catch (error) {
      throw error;
    }
  }
}
