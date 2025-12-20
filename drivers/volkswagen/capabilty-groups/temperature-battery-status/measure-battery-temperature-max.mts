import type { FloatString } from "../../api/types.mjs";
import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability, { type CapabilityOptions } from "../capability.mjs";

export default class MeasureBatteryTemperatureMaxCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_battery_temperature.max";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<number> => {
		const batteryTempMax =
			capabilities.measurements?.temperatureBatteryStatus?.value
				?.temperatureHvBatteryMax_K;

		if (!this.isFloatString(batteryTempMax)) {
			throw new InvalidValueError(batteryTempMax);
		}

		return this.kelvinToCelsius(batteryTempMax);
	};

	public override getOptions = async (
		_vehicleData: VehicleData,
	): Promise<Partial<CapabilityOptions>> => {
		return {
			title: this.volkswagenDevice.homey.__(
				"capabilities.measure_battery_temperature.title",
				{
					name: this.volkswagenDevice.homey.__(
						"capabilities.measure_battery_temperature.variables.max",
					),
				},
			),
		};
	};

	private kelvinToCelsius(kelvin: FloatString): number {
		return Number.parseFloat(kelvin) - 273.15;
	}
}
