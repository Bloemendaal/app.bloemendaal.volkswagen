import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability, { type CapabilityOptions } from "../capability.mjs";

export default class CoordinateLongitudeCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "coordinate.longitude";
	}

	public override getter = async ({
		parkingPosition,
	}: VehicleData): Promise<number> => {
		if (!parkingPosition) {
			throw new InvalidValueError(parkingPosition);
		}

		return parkingPosition.lon;
	};

	public override getOptions = async (
		_vehicleData: VehicleData,
	): Promise<Partial<CapabilityOptions>> => {
		return {
			title: this.volkswagenDevice.homey.__("capabilities.coordinate.title", {
				name: this.volkswagenDevice.homey.__(
					"capabilities.coordinate.variables.longitude",
				),
			}),
		};
	};
}
