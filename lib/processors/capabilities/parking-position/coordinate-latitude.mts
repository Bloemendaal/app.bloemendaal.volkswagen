import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class CoordinateLatitudeCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "coordinate.latitude";
	}

	public override async getter({
		parkingPosition,
	}: FetchData): Promise<number> {
		if (!parkingPosition?.parked) {
			throw new InvalidValueError(parkingPosition);
		}

		return parkingPosition.lat;
	}

	public override async setter(_fetchData: FetchData): Promise<void> {
		this.device.setCapabilityOptions(this.getCapabilityName(), {
			title: this.device.homey.__("capabilities.coordinate.title", {
				name: this.device.homey.__(
					"capabilities.coordinate.variables.latitude",
				),
			}),
		});
	}
}
