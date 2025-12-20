import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability, { type Options } from "../capability.mjs";

export default class MeasureBatteryUntilTargetSocCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_battery.until_target_soc";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<number> => {
		const currentSoC =
			capabilities.charging?.batteryStatus?.value?.currentSOC_pct;

		const targetSoC =
			capabilities.charging?.chargingSettings?.value?.targetSOC_pct;

		if (!this.isNumber(currentSoC) || !this.isNumber(targetSoC)) {
			throw new InvalidValueError({ currentSoC, targetSoC });
		}

		return Math.max(0, targetSoC - currentSoC);
	};

	public override getOptions = async (
		_vehicleData: VehicleData,
	): Promise<Partial<Options>> => {
		return {
			uiComponent: "sensor",
			title: this.volkswagenDevice.homey.__(
				"capabilities.measure_battery.title",
				{
					name: this.volkswagenDevice.homey.__(
						"capabilities.measure_battery.variables.until_target_soc",
					),
				},
			),
		};
	};
}
