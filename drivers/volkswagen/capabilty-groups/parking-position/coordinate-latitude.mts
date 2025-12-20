import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability, { type Options } from "../capability.mjs";

export default class CoordinateLatitudeCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "coordinate.latitude";
	}

	public override getter = async ({
		parkingPosition,
	}: VehicleData): Promise<number> => {
		if (!parkingPosition) {
			throw new InvalidValueError(parkingPosition);
		}

		return parkingPosition.lat;
	};

	public override getOptions = async (
		_vehicleData: VehicleData,
	): Promise<Partial<Options>> => {
		return {
			title: this.volkswagenDevice.homey.__("capabilities.coordinate.title", {
				name: this.volkswagenDevice.homey.__(
					"capabilities.coordinate.variables.latitude",
				),
			}),
		};
	};
}
