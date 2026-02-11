import type { Authenticatable } from "../authenticatable.mjs";
import SeatCupraUser from "../users/seatcupra-user.mjs";
import type SeatCupraVehicle from "../vehicles/seatcupra-vehicle.mjs";
import BaseDevice from "./base-device.mjs";

/**
 * Device class for SEAT and Cupra vehicles
 * Uses the SEAT/Cupra specific API endpoints (/v2/users/{userId}/*)
 */
export default abstract class SeatCupraDevice extends BaseDevice<
	SeatCupraUser,
	SeatCupraVehicle
> {
	protected createUser(authenticator: Authenticatable): SeatCupraUser {
		return new SeatCupraUser(authenticator);
	}
}
