import type { DateTimeString, Integer } from "../types.js";

export interface WarningLightsData {
	carCapturedTimestamp: DateTimeString;
	mileage_km: Integer;
}

export interface VehicleHealthWarningsCapabilitiesData {
	warningLights: {
		value: WarningLightsData;
	};
}
