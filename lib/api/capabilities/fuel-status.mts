import type { ApiResponse, DateTimeString, Integer } from "#lib/types.mjs";

export interface ElectricEngineData {
	type: "electric";
	currentSOC_pct: Integer;
	remainingRange_km: Integer;
}

export interface GasolineEngineData {
	type: "gasoline";
	currentSOC_pct: Integer;
	currentFuelLevel_pct: Integer;
}

export interface DieselEngineData {
	type: "diesel";
	currentSOC_pct: Integer;
	remainingRange_km: Integer;
	currentFuelLevel_pct: Integer;
}

export type EngineData =
	| ElectricEngineData
	| GasolineEngineData
	| DieselEngineData;

export type CarType = EngineData["type"] | "hybrid";

export interface RangeStatusData {
	carCapturedTimestamp: DateTimeString;
	carType: CarType;
	primaryEngine: EngineData;
	secondaryEngine?: EngineData;
	totalRange_km: Integer;
}

export interface FuelStatusCapabilitiesData {
	rangeStatus?: ApiResponse<RangeStatusData>;
}
