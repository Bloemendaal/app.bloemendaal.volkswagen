import type { ApiResponse } from "#lib/types.mjs";
import type { ChargingProfilesData } from "./automation.mjs";

export interface ChargingProfilesCapabilitiesData {
	chargingProfilesStatus?: ApiResponse<ChargingProfilesData>;
}
