import type {
	ApiResponse,
	DateTimeString,
	FloatString,
	Integer,
} from "#lib/types.mjs";
import type { CarType, EngineData } from "./fuel-status.mjs";

export interface RangeStatusData {
	carCapturedTimestamp: DateTimeString;
	adBlueRange?: Integer;
	dieselRange?: Integer;
	electricRange?: Integer;
	gasolineRange?: Integer;
	totalRange_km?: Integer;
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
	primaryEngineType: EngineData["type"];
	carType: CarType;
}

export interface MeasurementsCapabilitiesData {
	rangeStatus?: ApiResponse<RangeStatusData>;
	odometerStatus?: ApiResponse<OdometerStatusData>;
	temperatureBatteryStatus?: ApiResponse<TemperatureBatteryStatusData>;
	fuelLevelStatus?: ApiResponse<FuelLevelStatusData>;
}
