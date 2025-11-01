import type {
	DateTimeString,
	Integer,
	PossiblyUnknownString,
} from "../types.mjs";

export interface ClimatisationSettingsData {
	carCapturedTimestamp: DateTimeString;
	targetTemperature_C: Integer;
	targetTemperature_F: Integer;
	unitInCar: "celsius" | "fahrenheit";
	climatizationAtUnlock: boolean;
	windowHeatingEnabled: boolean;
	zoneFrontLeftEnabled: boolean;
	zoneFrontRightEnabled: boolean;
}

export interface ClimatisationStatusData {
	carCapturedTimestamp: DateTimeString;
	remainingClimatisationTime_min: Integer;
	climatisationState: "off" | PossiblyUnknownString;
}

export interface WindowHeatingStatusData {
	carCapturedTimestamp: DateTimeString;
	windowHeatingStatus: {
		windowLocation: "front" | "rear";
		windowHeatingState: "off" | PossiblyUnknownString;
	}[];
}

export interface ClimatisationCapabilitiesData {
	climatisationSettings: {
		value: ClimatisationSettingsData;
	};
	climatisationStatus: {
		value: ClimatisationStatusData;
	};
	windowHeatingStatus: {
		value: WindowHeatingStatusData;
	};
}
