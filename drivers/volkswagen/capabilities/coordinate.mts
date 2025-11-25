import Capability, { type VehicleData } from "./capability.mjs";

export default class Coordinate extends Capability {
	protected override getCapabilityName(): string {
		return "coordinate";
	}

	public override async addCapabilities(
		vehicleData: VehicleData,
	): Promise<void> {
		const parkingPosition = vehicleData.parkingPosition;

		if (!parkingPosition) {
			return;
		}

		await this.addTimestampCapability(parkingPosition.carCapturedTimestamp);

		if (!this.volkswagenDevice.hasCapability("coordinate.latitude")) {
			await this.volkswagenDevice.addCapability("coordinate.latitude");
		}

		await this.volkswagenDevice.setCapabilityOptions("coordinate.latitude", {
			title: this.volkswagenDevice.homey.__("capabilities.coordinate.title", {
				name: this.volkswagenDevice.homey.__(
					"capabilities.coordinate.variables.latitude",
				),
			}),
		});

		if (!this.volkswagenDevice.hasCapability("coordinate.longitude")) {
			await this.volkswagenDevice.addCapability("coordinate.longitude");
		}

		await this.volkswagenDevice.setCapabilityOptions("coordinate.longitude", {
			title: this.volkswagenDevice.homey.__("capabilities.coordinate.title", {
				name: this.volkswagenDevice.homey.__(
					"capabilities.coordinate.variables.longitude",
				),
			}),
		});
	}

	public override async setCapabilityValues(
		vehicleData: VehicleData,
	): Promise<void> {
		const parkingPosition = vehicleData.parkingPosition;

		if (!parkingPosition) {
			return;
		}

		if (this.volkswagenDevice.hasCapability("coordinate.latitude")) {
			await this.volkswagenDevice.setCapabilityValue(
				"coordinate.latitude",
				parkingPosition.lat,
			);
		}

		if (this.volkswagenDevice.hasCapability("coordinate.longitude")) {
			await this.volkswagenDevice.setCapabilityValue(
				"coordinate.longitude",
				parkingPosition.lon,
			);
		}
	}
}
