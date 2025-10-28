import type { AccessCapabilitiesData } from "./capabilities/access.js";
import type { AutomationCapabilitiesData } from "./capabilities/automation.js";
import type { BatteryChargingCareCapabilitiesData } from "./capabilities/battery-charging-care.js";
import type { BatterySupportCapabilitiesData } from "./capabilities/battery-support.js";
import type { ChargingCapabilitiesData } from "./capabilities/charging.js";
import type { ChargingProfilesCapabilitiesData } from "./capabilities/charging-profiles.js";
import type { ClimatisationCapabilitiesData } from "./capabilities/climatisation.js";
import type { ClimatisationTimersCapabilitiesData } from "./capabilities/climatisation-timers.js";
import type { FuelStatusCapabilitiesData } from "./capabilities/fuel-status.js";
import type { MeasurementsCapabilitiesData } from "./capabilities/measurements.js";
import type { ReadinessCapabilitiesData } from "./capabilities/readiness.js";
import type { UserCapabilitiesData } from "./capabilities/user-capabilities.js";
import type { VehicleHealthInspectionCapabilitiesData } from "./capabilities/vehicle-health-inspection.js";
import type { VehicleHealthWarningsCapabilitiesData } from "./capabilities/vehicle-health-warnings.js";
import type { VehicleLightsCapabilitiesData } from "./capabilities/vehicle-lights.js";

export interface SelectiveStatusCapabilitiesData {
	access: AccessCapabilitiesData;
	activeventilation: unknown;
	automation: AutomationCapabilitiesData;
	auxiliaryheating: unknown;
	batteryChargingCare: BatteryChargingCareCapabilitiesData;
	batterySupport: BatterySupportCapabilitiesData;
	charging: ChargingCapabilitiesData;
	chargingProfiles: ChargingProfilesCapabilitiesData;
	climatisation: ClimatisationCapabilitiesData;
	climatisationTimers: ClimatisationTimersCapabilitiesData;
	departureTimers: unknown;
	fuelStatus: FuelStatusCapabilitiesData;
	lvBattery: unknown;
	measurements: MeasurementsCapabilitiesData;
	oilLevel: unknown;
	readiness: ReadinessCapabilitiesData;
	userCapabilities: UserCapabilitiesData;
	vehicleHealthInspection: VehicleHealthInspectionCapabilitiesData;
	vehicleHealthWarnings: VehicleHealthWarningsCapabilitiesData;
	vehicleLights: VehicleLightsCapabilitiesData;
}

export const selectiveStatusCapabilities: (keyof SelectiveStatusCapabilitiesData)[] =
	[
		"access",
		"activeventilation",
		"automation",
		"auxiliaryheating",
		"batteryChargingCare",
		"batterySupport",
		"charging",
		"chargingProfiles",
		"climatisation",
		"climatisationTimers",
		"departureTimers",
		"fuelStatus",
		"lvBattery",
		"measurements",
		"oilLevel",
		"readiness",
		"userCapabilities",
		"vehicleHealthInspection",
		"vehicleHealthWarnings",
		"vehicleLights",
	];
