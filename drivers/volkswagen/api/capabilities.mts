import type { AccessCapabilitiesData } from "./capabilities/access.mjs";
import type { AutomationCapabilitiesData } from "./capabilities/automation.mjs";
import type { BatteryChargingCareCapabilitiesData } from "./capabilities/battery-charging-care.mjs";
import type { BatterySupportCapabilitiesData } from "./capabilities/battery-support.mjs";
import type { ChargingCapabilitiesData } from "./capabilities/charging.mjs";
import type { ChargingProfilesCapabilitiesData } from "./capabilities/charging-profiles.mjs";
import type { ClimatisationCapabilitiesData } from "./capabilities/climatisation.mjs";
import type { ClimatisationTimersCapabilitiesData } from "./capabilities/climatisation-timers.mjs";
import type { FuelStatusCapabilitiesData } from "./capabilities/fuel-status.mjs";
import type { MeasurementsCapabilitiesData } from "./capabilities/measurements.mjs";
import type { ReadinessCapabilitiesData } from "./capabilities/readiness.mjs";
import type { UserCapabilitiesData } from "./capabilities/user-capabilities.mjs";
import type { VehicleHealthInspectionCapabilitiesData } from "./capabilities/vehicle-health-inspection.mjs";
import type { VehicleHealthWarningsCapabilitiesData } from "./capabilities/vehicle-health-warnings.mjs";
import type { VehicleLightsCapabilitiesData } from "./capabilities/vehicle-lights.mjs";

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
