import type {
	ApiResponse,
	DateTimeString,
	PossiblyUnknownString,
} from "../../types.mjs";

export interface LightData {
	name: "right" | "left";
	status: "off" | PossiblyUnknownString;
}

export interface LightsStatusData {
	carCapturedTimestamp: DateTimeString;
	lights: LightData[];
}

export interface VehicleLightsCapabilitiesData {
	lightsStatus?: ApiResponse<LightsStatusData>;
}
