import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import type { FloatString } from "../../types.mjs";
import Capability, { type CapabilityOptions } from "../capability.mjs";

export default class MeasureBatteryTemperatureMinCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_battery_temperature.min";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<number> => {
		const batteryTempMin =
			capabilities.measurements?.temperatureBatteryStatus?.value
				?.temperatureHvBatteryMin_K;

		if (!this.isFloatString(batteryTempMin)) {
			throw new InvalidValueError(batteryTempMin);
		}

		return this.kelvinToCelsius(batteryTempMin);
	};

	public override getOptions = async (
		_vehicleData: VehicleData,
	): Promise<Partial<CapabilityOptions>> => {
		return {
			title: this.volkswagenDevice.homey.__(
				"capabilities.measure_battery_temperature.title",
				{
					name: this.volkswagenDevice.homey.__(
						"capabilities.measure_battery_temperature.variables.min",
					),
				},
			),
		};
	};

	private kelvinToCelsius(kelvin: FloatString): number {
		return Number.parseFloat(kelvin) - 273.15;
	}
}
