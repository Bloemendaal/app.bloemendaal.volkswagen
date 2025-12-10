import type { PossiblyUnknownString } from "../types.mjs";

export interface BatteryChargingCareCapabilitiesData {
	chargingCareSettings?: {
		value: {
			batteryCareMode: "activated" | PossiblyUnknownString;
		};
	};
}
