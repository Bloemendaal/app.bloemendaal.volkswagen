import Capability, { type VehicleData } from "./capability.mjs";

export default class BatteryStatus extends Capability {
	protected override getCapabilityName(): string {
		return "battery_status";
	}

	public override async addCapabilities({
		capabilities,
	}: VehicleData): Promise<void> {
		await this.addTimestampCapability(
			capabilities.charging?.batteryStatus.value.carCapturedTimestamp,
		);

		const validSoC = this.isNumber(
			capabilities.charging?.batteryStatus.value.currentSOC_pct,
		);

		if (validSoC && !this.volkswagenDevice.hasCapability("measure_battery")) {
			await this.volkswagenDevice.addCapability("measure_battery");
		}

		if (
			validSoC &&
			!this.volkswagenDevice.hasCapability("measure_battery_percentage")
		) {
			await this.volkswagenDevice.addCapability("measure_battery_percentage");
		}

		const validRange = this.isNumber(
			capabilities.charging?.batteryStatus.value.cruisingRangeElectric_km,
		);

		if (!this.volkswagenDevice.hasCapability("measure_range") && validRange) {
			await this.volkswagenDevice.addCapability("measure_range");
		}

		const validTargetSoC = this.isNumber(
			capabilities.charging?.chargingSettings?.value.targetSOC_pct,
		);

		if (
			validSoC &&
			validTargetSoC &&
			!this.volkswagenDevice.hasCapability("measure_battery.until_target_soc")
		) {
			await this.volkswagenDevice.addCapability(
				"measure_battery.until_target_soc",
			);

			await this.volkswagenDevice.setCapabilityOptions(
				"measure_battery.until_target_soc",
				{
					uiComponent: "sensor",
					title: this.volkswagenDevice.homey.__(
						"capabilities.measure_battery.title",
						{
							name: this.volkswagenDevice.homey.__(
								"capabilities.measure_battery.variables.until_target_soc",
							),
						},
					),
				},
			);
		}

		if (
			validSoC &&
			!this.volkswagenDevice.hasCapability("measure_battery.until_full")
		) {
			await this.volkswagenDevice.addCapability("measure_battery.until_full");

			await this.volkswagenDevice.setCapabilityOptions(
				"measure_battery.until_full",
				{
					uiComponent: "sensor",
					title: this.volkswagenDevice.homey.__(
						"capabilities.measure_battery.title",
						{
							name: this.volkswagenDevice.homey.__(
								"capabilities.measure_battery.variables.until_full",
							),
						},
					),
				},
			);
		}
	}

	public override async setCapabilityValues({
		capabilities,
	}: VehicleData): Promise<void> {
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

		if (
			this.isNumber(currentSoC) &&
			this.volkswagenDevice.hasCapability("measure_battery_percentage")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"measure_battery_percentage",
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

		const targetSoC =
			capabilities.charging?.chargingSettings?.value.targetSOC_pct;

		if (
			this.isNumber(targetSoC) &&
			this.isNumber(currentSoC) &&
			this.volkswagenDevice.hasCapability("measure_battery.until_target_soc")
		) {
			const untilTargetSoC = Math.max(0, targetSoC - currentSoC);
			await this.volkswagenDevice.setCapabilityValue(
				"measure_battery.until_target_soc",
				untilTargetSoC,
			);
		}

		if (
			this.isNumber(currentSoC) &&
			this.volkswagenDevice.hasCapability("measure_battery.until_full")
		) {
			const untilFull = Math.max(0, 100 - currentSoC);
			await this.volkswagenDevice.setCapabilityValue(
				"measure_battery.until_full",
				untilFull,
			);
		}
	}
}
