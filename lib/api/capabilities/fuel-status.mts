import type {
  ApiResponse,
  DateTimeString,
  Integer,
  PossiblyUnknownString,
} from "../../types.mjs";

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

export type PrimaryEngineData = ElectricEngineData | GasolineEngineData;

export interface RangeStatusData {
  carCapturedTimestamp: DateTimeString;
  carType: "electric" | PossiblyUnknownString;
  primaryEngine: PrimaryEngineData;
  secondaryEngine?: PrimaryEngineData;
  totalRange_km: Integer;
}

export interface FuelStatusCapabilitiesData {
  rangeStatus?: ApiResponse<RangeStatusData>;
}
