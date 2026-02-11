import type { Authenticatable } from "../authenticatable.mjs";
import VolkswagenUser from "../users/volkswagen-user.mjs";
import type VolkswagenVehicle from "../vehicles/volkswagen-vehicle.mjs";
import VagDevice from "./vag-device.mjs";

/**
 * Device class for Volkswagen and Skoda vehicles
 * Uses the standard VAG API endpoints (/vehicle/v1/*)
 */
export default abstract class VolkswagenDevice extends VagDevice<
	VolkswagenUser,
	VolkswagenVehicle
> {
	protected createUser(authenticator: Authenticatable): VolkswagenUser {
		return new VolkswagenUser(authenticator);
	}
}
