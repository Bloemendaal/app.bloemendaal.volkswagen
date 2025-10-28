import type { PossiblyUnknownString } from "../types.js";

export interface BatteryChargingCareCapabilitiesData {
	chargingCareSettings: {
		value: {
			batteryCareMode: "activated" | PossiblyUnknownString;
		};
	};
}
