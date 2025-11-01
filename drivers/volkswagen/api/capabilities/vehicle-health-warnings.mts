import type { DateTimeString, Integer } from "../types.mjs";

export interface WarningLightsData {
	carCapturedTimestamp: DateTimeString;
	mileage_km: Integer;
}

export interface VehicleHealthWarningsCapabilitiesData {
	warningLights: {
		value: WarningLightsData;
	};
}
