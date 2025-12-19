import type { PossiblyUnknownString } from "../types.mjs";

export interface BatterySupportCapabilitiesData {
	batterySupportStatus?: {
		value?: {
			batterySupport: "disabled" | "enabled" | PossiblyUnknownString;
		};
	};
}
