import type { FetchData } from "../../api/fetch.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureChargingRateCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_charging_rate";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const chargeRate =
			capabilities.charging?.chargingStatus?.value?.chargeRate_kmph;

		if (!this.isNumber(chargeRate)) {
			throw new InvalidValueError(chargeRate);
		}

		return chargeRate;
	}
}
