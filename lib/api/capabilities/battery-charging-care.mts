import type { ApiResponse, PossiblyUnknownString } from "../../types.mjs";

export interface BatteryChargingCareCapabilitiesData {
	chargingCareSettings?: ApiResponse<{
		batteryCareMode: "activated" | PossiblyUnknownString;
	}>;
}
