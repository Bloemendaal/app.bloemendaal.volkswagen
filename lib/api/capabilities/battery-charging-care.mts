import type { ApiResponse, PossiblyUnknownString } from "#lib/types.mjs";

export interface BatteryChargingCareCapabilitiesData {
	chargingCareSettings?: ApiResponse<{
		batteryCareMode: "activated" | PossiblyUnknownString;
	}>;
}
