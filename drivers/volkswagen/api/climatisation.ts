import type { PossiblyUnknownString } from "./types.js";

export interface ClimatisationSettings {
	targetTemperature?: number;
	targetTemperatureUnit?: "celsius" | "fahrenheit";
	climatisationWithoutExternalPower?: boolean;
	climatizationAtUnlock?: boolean;
	windowHeatingEnabled?: boolean;
	zoneFrontLeftEnabled?: boolean;
	zoneFrontRightEnabled?: boolean;
	zoneRearLeftEnabled?: boolean;
	zoneRearRightEnabled?: boolean;
}

export interface StartClimatisationSettings extends ClimatisationSettings {
	heaterSource?: "electric" | PossiblyUnknownString;
}
