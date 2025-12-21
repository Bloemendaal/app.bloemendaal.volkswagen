import type { FetchData } from "../../api/fetch.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class IsChargingCapability extends Capability<boolean> {
	protected getCapabilityName(): string {
		return "is_charging";
	}

	public override async getter({ capabilities }: FetchData): Promise<boolean> {
		const chargingState =
			capabilities.charging?.chargingStatus?.value?.chargingState;

		if (!chargingState || chargingState === "unsupported") {
			throw new InvalidValueError(chargingState);
		}

		return chargingState === "charging";
	}
}
