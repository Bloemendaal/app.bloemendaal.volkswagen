import type { DateTimeString, Float } from "../types.mjs";

export interface ParkingPositionData {
	lon: Float;
	lat: Float;
	carCapturedTimestamp: DateTimeString;
}
