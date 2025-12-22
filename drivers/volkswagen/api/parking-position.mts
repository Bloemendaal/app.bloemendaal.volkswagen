import type { DateTimeString, Float } from "../types.mjs";

export interface ParkingPositionResponse {
	lon: Float;
	lat: Float;
	carCapturedTimestamp: DateTimeString;
}

interface ParkedPosition extends ParkingPositionResponse {
	parked: true;
}

export type ParkingPositionData = ParkedPosition | { parked: false };
