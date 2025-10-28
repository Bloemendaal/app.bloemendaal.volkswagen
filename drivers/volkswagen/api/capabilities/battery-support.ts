import type { PossiblyUnknownString } from "../types.js";

export interface BatterySupportCapabilitiesData {
	batterySupportStatus: {
		value: {
			batterySupport: "disabled" | "enabled" | PossiblyUnknownString;
		};
	};
}
