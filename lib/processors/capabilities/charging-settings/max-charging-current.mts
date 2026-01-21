import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export const MAX_CHARGING_CURRENT = 16;
export const REDUCED_CHARGING_CURRENT = 6;

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
			return MAX_CHARGING_CURRENT;
		}

		if (maxChargeCurrentAC === "reduced") {
			return REDUCED_CHARGING_CURRENT;
		}

		throw new InvalidValueError({ maxChargeCurrentAC, maxChargeCurrentAC_A });
	}
}
