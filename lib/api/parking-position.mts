import type { DateTimeString, Float } from "#lib/types.mjs";

export interface ParkingPositionResponse {
	lon: Float;
	lat: Float;
	carCapturedTimestamp: DateTimeString;
}

export interface ParkedPosition extends ParkingPositionResponse {
	parked: true;
}

export type ParkingPositionData = ParkedPosition | { parked: false };
