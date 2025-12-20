import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureRangeCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_range";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<number> => {
		const cruisingRangeElectric =
			capabilities.charging?.batteryStatus?.value?.cruisingRangeElectric_km;

		if (!this.isNumber(cruisingRangeElectric)) {
			throw new InvalidValueError(cruisingRangeElectric);
		}

		return cruisingRangeElectric;
	};
}
