import type { FetchData } from "../../api/fetch.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

type ChargingStateValue =
	| "plugged_out"
	| "plugged_in"
	| "plugged_in_charging"
	| "plugged_in_paused"
	| "plugged_in_discharging"
	| null;

export default class EvChargingStateCapability extends Capability<ChargingStateValue> {
	protected getCapabilityName(): string {
		return "ev_charging_state";
	}

	public override async getter({
		capabilities,
	}: FetchData): Promise<ChargingStateValue> {
		const chargingState =
			capabilities.charging?.chargingStatus?.value?.chargingState;

		if (!chargingState || chargingState === "unsupported") {
			throw new InvalidValueError(chargingState);
		}

		const stateMap: Record<string, ChargingStateValue> = {
			off: "plugged_out",
			readyForCharging: "plugged_in",
			notReadyForCharging: "plugged_out",
			conservation: null,
			chargePurposeReachedAndNotConservationCharging: null,
			chargePurposeReachedAndConservation: null,
			charging: "plugged_in_charging",
			error: "plugged_in_paused",
			unsupported: null,
			discharging: "plugged_in_discharging",
		};

		return stateMap[chargingState] ?? null;
	}
}
