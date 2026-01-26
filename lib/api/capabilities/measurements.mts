import type {
  ApiResponse,
  DateTimeString,
  FloatString,
  Integer,
  PossiblyUnknownString,
} from "../../types.mjs";
import type { PrimaryEngineData } from "./fuel-status.mjs";

export interface RangeStatusData {
  carCapturedTimestamp: DateTimeString;
}

export interface OdometerStatusData {
  carCapturedTimestamp: DateTimeString;
  odometer: Integer;
}

export interface TemperatureBatteryStatusData {
  carCapturedTimestamp: DateTimeString;
  temperatureHvBatteryMin_K: FloatString;
  temperatureHvBatteryMax_K: FloatString;
}

export interface FuelLevelStatusData {
  carCapturedTimestamp: DateTimeString;
  currentFuelLevel_pct?: Integer;
  primaryEngineType: PrimaryEngineData["type"] | PossiblyUnknownString;
  carType: PrimaryEngineData["type"] | PossiblyUnknownString;
}

export interface MeasurementsCapabilitiesData {
  rangeStatus?: ApiResponse<RangeStatusData>;
  odometerStatus?: ApiResponse<OdometerStatusData>;
  temperatureBatteryStatus?: ApiResponse<TemperatureBatteryStatusData>;
  fuelLevelStatus?: ApiResponse<FuelLevelStatusData>;
}
