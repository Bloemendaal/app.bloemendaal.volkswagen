import type { ApiResponse, DateTimeString, Integer } from "../../types.mjs";

export interface MaintenanceStatusData {
	carCapturedTimestamp: DateTimeString;
	inspectionDue_days: Integer;
	inspectionDue_km?: Integer;
	mileage_km: Integer;
	oilServiceDue_days?: Integer;
	oilServiceDue_km?: Integer;
}

export interface VehicleHealthInspectionCapabilitiesData {
	maintenanceStatus?: ApiResponse<MaintenanceStatusData>;
}
