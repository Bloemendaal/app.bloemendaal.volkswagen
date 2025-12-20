import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureBatteryPercentageCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_battery_percentage";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<number> => {
		const currentSoC =
			capabilities.charging?.batteryStatus?.value?.currentSOC_pct;

		if (!this.isNumber(currentSoC)) {
			throw new InvalidValueError(currentSoC);
		}

		return currentSoC;
	};
}
