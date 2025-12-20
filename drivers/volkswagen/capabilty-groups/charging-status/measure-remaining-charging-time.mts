import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureRemainingChargingTimeCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_remaining_charging_time";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<number> => {
		const remainingTime =
			capabilities.charging?.chargingStatus?.value
				?.remainingChargingTimeToComplete_min;

		if (!this.isNumber(remainingTime)) {
			throw new InvalidValueError(remainingTime);
		}

		return remainingTime;
	};
}
