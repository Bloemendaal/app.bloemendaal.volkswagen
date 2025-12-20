import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability, { type CapabilityOptions } from "../capability.mjs";

export default class MeasureBatteryUntilFullCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_battery.until_full";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<number> => {
		const currentSoC =
			capabilities.charging?.batteryStatus?.value?.currentSOC_pct;

		if (!this.isNumber(currentSoC)) {
			throw new InvalidValueError(currentSoC);
		}

		return Math.max(0, 100 - currentSoC);
	};

	public override getOptions = async (
		_vehicleData: VehicleData,
	): Promise<Partial<CapabilityOptions>> => {
		return {
			uiComponent: "sensor",
			title: this.volkswagenDevice.homey.__(
				"capabilities.measure_battery.title",
				{
					name: this.volkswagenDevice.homey.__(
						"capabilities.measure_battery.variables.until_full",
					),
				},
			),
		};
	};
}
