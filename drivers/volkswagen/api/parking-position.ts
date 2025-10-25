import type { DateTimeString, Float } from "./types.js";

export interface ParkingPositionData {
	lon: Float;
	lat: Float;
	carCapturedTimestamp: DateTimeString;
}
