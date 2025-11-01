import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.js";
import Capability from "./capability.js";

export default class OdometerStatus extends Capability {
	protected override getCapabilityName(): string {
		return "odometer_status";
	}

	public override async addCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const promises: Promise<void>[] = [
			this.addTimestampCapability(
				capabilities.measurements?.odometerStatus.value.carCapturedTimestamp,
			),
		];

		const validOdometer = this.isNumber(
			capabilities.measurements?.odometerStatus.value.odometer,
		);

		if (
			validOdometer &&
			!this.volkswagenDevice.hasCapability("meter_odometer")
		) {
			promises.push(this.volkswagenDevice.addCapability("meter_odometer"));
		}

		await Promise.all(promises);
	}

	public override async setCapabilityValues(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const hasNewerTimestamp = await this.checkTimestamp(
			capabilities.measurements?.odometerStatus.value.carCapturedTimestamp,
		);

		if (!hasNewerTimestamp) {
			return;
		}

		const odometer = capabilities.measurements?.odometerStatus.value.odometer;

		if (
			this.isNumber(odometer) &&
			this.volkswagenDevice.hasCapability("meter_odometer")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"meter_odometer",
				odometer,
			);
		}
	}
}
