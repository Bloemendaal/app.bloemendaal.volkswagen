import type { ApiResponse, DateTimeString, Integer } from "#lib/types.mjs";

export interface WarningLightsData {
	carCapturedTimestamp: DateTimeString;
	mileage_km: Integer;
}

export interface VehicleHealthWarningsCapabilitiesData {
	warningLights?: ApiResponse<WarningLightsData>;
}
