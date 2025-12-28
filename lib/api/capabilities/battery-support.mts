import type { ApiResponse, PossiblyUnknownString } from "../../types.mjs";

export interface BatterySupportCapabilitiesData {
	batterySupportStatus?: ApiResponse<{
		batterySupport: "disabled" | "enabled" | PossiblyUnknownString;
	}>;
}
