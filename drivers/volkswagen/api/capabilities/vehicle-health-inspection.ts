import type { DateTimeString, Integer } from "../types.js";

export interface MaintenanceStatusData {
	carCapturedTimestamp: DateTimeString;
	inspectionDue_days: Integer;
	mileage_km: Integer;
}

export interface VehicleHealthInspectionCapabilitiesData {
	maintenanceStatus: {
		value: MaintenanceStatusData;
	};
}
