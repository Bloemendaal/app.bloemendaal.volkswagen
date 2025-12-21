import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import type { FloatString } from "../../../types.mjs";
import Capability from "../capability.mjs";

export default class MeasureBatteryTemperatureMinCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_battery_temperature.min";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const batteryTempMin =
			capabilities.measurements?.temperatureBatteryStatus?.value
				?.temperatureHvBatteryMin_K;

		if (!this.isFloatString(batteryTempMin)) {
			throw new InvalidValueError(batteryTempMin);
		}

		return this.kelvinToCelsius(batteryTempMin);
	}

	public override async setter(_fetchData: FetchData): Promise<void> {
		this.volkswagenDevice.setCapabilityOptions(this.getCapabilityName(), {
			title: this.volkswagenDevice.homey.__(
				"capabilities.measure_battery_temperature.title",
				{
					name: this.volkswagenDevice.homey.__(
						"capabilities.measure_battery_temperature.variables.min",
					),
				},
			),
		});
	}

	private kelvinToCelsius(kelvin: FloatString): number {
		return Number.parseFloat(kelvin) - 273.15;
	}
}
