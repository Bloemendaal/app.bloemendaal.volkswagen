import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class CoordinateLongitudeCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "coordinate.longitude";
	}

	public override async getter({
		parkingPosition,
	}: FetchData): Promise<number> {
		if (!parkingPosition?.parked) {
			throw new InvalidValueError(parkingPosition);
		}

		return parkingPosition.lon;
	}

	public override async setter(_fetchData: FetchData): Promise<void> {
		this.volkswagenDevice.setCapabilityOptions(this.getCapabilityName(), {
			title: this.volkswagenDevice.homey.__("capabilities.coordinate.title", {
				name: this.volkswagenDevice.homey.__(
					"capabilities.coordinate.variables.longitude",
				),
			}),
		});
	}
}
