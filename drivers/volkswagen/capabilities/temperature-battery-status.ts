import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.js";
import Capability from "./capability.js";

export default class TemperatureBatteryStatus extends Capability {
	private kelvinToCelsius(kelvin: string): number {
		return Number.parseFloat(kelvin) - 273.15;
	}

	protected override getCapabilityName(): string {
		return "temperature_battery_status";
	}

	public override async addCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const addPromises: Promise<void>[] = [
			this.addTimestampCapability(
				capabilities.measurements?.temperatureBatteryStatus.value
					.carCapturedTimestamp,
			),
		];

		const optionsPromises: Promise<void>[] = [];

		const validBatteryTempMin = this.isFloatString(
			capabilities.measurements?.temperatureBatteryStatus.value
				.temperatureHvBatteryMin_K,
		);

		if (
			validBatteryTempMin &&
			!this.volkswagenDevice.hasCapability("measure_battery_temperature.min")
		) {
			addPromises.push(
				this.volkswagenDevice.addCapability("measure_battery_temperature.min"),
			);

			optionsPromises.push(
				this.volkswagenDevice.setCapabilityOptions(
					"measure_battery_temperature.min",
					{
						title: this.volkswagenDevice.homey.__(
							"capabilities.measure_battery_temperature.title",
							{
								name: this.volkswagenDevice.homey.__(
									"capabilities.measure_battery_temperature.variables.min",
								),
							},
						),
					},
				),
			);
		}

		const validBatteryTempMax = this.isFloatString(
			capabilities.measurements?.temperatureBatteryStatus.value
				.temperatureHvBatteryMax_K,
		);

		if (
			validBatteryTempMax &&
			!this.volkswagenDevice.hasCapability("measure_battery_temperature.max")
		) {
			addPromises.push(
				this.volkswagenDevice.addCapability("measure_battery_temperature.max"),
			);

			optionsPromises.push(
				this.volkswagenDevice.setCapabilityOptions(
					"measure_battery_temperature.max",
					{
						title: this.volkswagenDevice.homey.__(
							"capabilities.measure_battery_temperature.title",
							{
								name: this.volkswagenDevice.homey.__(
									"capabilities.measure_battery_temperature.variables.max",
								),
							},
						),
					},
				),
			);
		}

		await Promise.all(addPromises);
		await Promise.all(optionsPromises);
	}

	public override async setCapabilityValues(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const hasNewerTimestamp = await this.checkTimestamp(
			capabilities.measurements?.temperatureBatteryStatus.value
				.carCapturedTimestamp,
		);

		if (!hasNewerTimestamp) {
			return;
		}

		const batteryTempMin =
			capabilities.measurements?.temperatureBatteryStatus.value
				.temperatureHvBatteryMin_K;

		if (
			this.isFloatString(batteryTempMin) &&
			this.volkswagenDevice.hasCapability("measure_battery_temperature.min")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"measure_battery_temperature.min",
				this.kelvinToCelsius(batteryTempMin),
			);
		}

		const batteryTempMax =
			capabilities.measurements?.temperatureBatteryStatus.value
				.temperatureHvBatteryMax_K;

		if (
			this.isFloatString(batteryTempMax) &&
			this.volkswagenDevice.hasCapability("measure_battery_temperature.max")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"measure_battery_temperature.max",
				this.kelvinToCelsius(batteryTempMax),
			);
		}
	}
}
