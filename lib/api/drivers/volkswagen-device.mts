import type { Authenticatable } from "../authenticatable.mjs";
import VolkswagenUser from "../users/volkswagen-user.mjs";
import type VolkswagenVehicle from "../vehicles/volkswagen-vehicle.mjs";
import BaseDevice from "./base-device.mjs";

/**
 * Device class for Volkswagen and Skoda vehicles
 * Uses the standard VAG API endpoints (/vehicle/v1/*)
 */
export default abstract class VolkswagenDevice extends BaseDevice<
	VolkswagenUser,
	VolkswagenVehicle
> {
	protected createUser(authenticator: Authenticatable): VolkswagenUser {
		return new VolkswagenUser(authenticator);
	}
}
