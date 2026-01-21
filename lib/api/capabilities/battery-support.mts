import type { ApiResponse, PossiblyUnknownString } from "#lib/types.mjs";

export interface BatterySupportCapabilitiesData {
	batterySupportStatus?: ApiResponse<{
		batterySupport: "disabled" | "enabled" | PossiblyUnknownString;
	}>;
}
