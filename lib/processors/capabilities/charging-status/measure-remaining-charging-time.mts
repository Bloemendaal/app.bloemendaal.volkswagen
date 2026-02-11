import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class MeasureRemainingChargingTimeCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_remaining_charging_time";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const remainingTime =
			capabilities.charging?.chargingStatus?.value
				?.remainingChargingTimeToComplete_min;

		if (!this.isNumber(remainingTime)) {
			throw new InvalidValueError(remainingTime);
		}

		return remainingTime;
	}
}
