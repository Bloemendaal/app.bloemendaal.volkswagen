import type {
	DateTimeString,
	Integer,
	PossiblyUnknownString,
} from "../types.mjs";

export interface PrimaryEngineData {
	type: "electric" | PossiblyUnknownString;
	currentSOC_pct: Integer;
	remainingRange_km: Integer;
}

export interface RangeStatusData {
	carCapturedTimestamp: DateTimeString;
	carType: "electric" | PossiblyUnknownString;
	primaryEngine: PrimaryEngineData;
	totalRange_km: Integer;
}

export interface FuelStatusCapabilitiesData {
	rangeStatus: {
		value: RangeStatusData;
	};
}
