import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.js";
import Capability from "./capability.js";

export default class BatteryStatus extends Capability {
	protected override getCapabilityName(): string {
		return "battery_status";
	}

	public override async addCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const promises: Promise<void>[] = [
			this.addTimestampCapability(
				capabilities.charging?.batteryStatus.value.carCapturedTimestamp,
			),
		];

		const validSoC = this.isNumber(
			capabilities.charging?.batteryStatus.value.currentSOC_pct,
		);

		if (!this.volkswagenDevice.hasCapability("measure_battery") && validSoC) {
			promises.push(this.volkswagenDevice.addCapability("measure_battery"));
		}

		const validRange = this.isNumber(
			capabilities.charging?.batteryStatus.value.cruisingRangeElectric_km,
		);

		if (!this.volkswagenDevice.hasCapability("measure_range") && validRange) {
			promises.push(this.volkswagenDevice.addCapability("measure_range"));
		}

		await Promise.all(promises);
	}

	public override async setCapabilityValues(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const hasNewerTimestamp = await this.checkTimestamp(
			capabilities.charging?.batteryStatus.value.carCapturedTimestamp,
		);

		if (!hasNewerTimestamp) {
			return;
		}

		const currentSoC =
			capabilities.charging?.batteryStatus.value.currentSOC_pct;

		if (
			this.isNumber(currentSoC) &&
			this.volkswagenDevice.hasCapability("measure_battery")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"measure_battery",
				currentSoC,
			);
		}

		const cruisingRangeElectric =
			capabilities.charging?.batteryStatus.value.cruisingRangeElectric_km;

		if (
			this.isNumber(cruisingRangeElectric) &&
			this.volkswagenDevice.hasCapability("measure_range")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"measure_range",
				cruisingRangeElectric,
			);
		}
	}
}
