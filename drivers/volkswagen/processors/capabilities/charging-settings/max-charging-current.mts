import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MaxChargingCurrentCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "max_charging_current";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const chargingSettings = capabilities.charging?.chargingSettings?.value;

		if (!chargingSettings) {
			throw new InvalidValueError(chargingSettings);
		}

		const maxChargeCurrentAC_A = chargingSettings.maxChargeCurrentAC_A;

		if (this.isNumber(maxChargeCurrentAC_A)) {
			return maxChargeCurrentAC_A;
		}

		const maxChargeCurrentAC = chargingSettings.maxChargeCurrentAC;

		if (maxChargeCurrentAC === "maximum") {
			return 16;
		}

		if (maxChargeCurrentAC === "reduced") {
			return 6;
		}

		throw new InvalidValueError({ maxChargeCurrentAC, maxChargeCurrentAC_A });
	}
}
