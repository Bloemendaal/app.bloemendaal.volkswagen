import type {
	DateTimeString,
	FloatString,
	Integer,
	PossiblyUnknownString,
} from "../types.mjs";

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
	primaryEngineType: "electric" | PossiblyUnknownString;
	carType: "electric" | PossiblyUnknownString;
}

export interface MeasurementsCapabilitiesData {
	rangeStatus: {
		value: RangeStatusData;
	};
	odometerStatus: {
		value: OdometerStatusData;
	};
	temperatureBatteryStatus: {
		value: TemperatureBatteryStatusData;
	};
	fuelLevelStatus: {
		value: FuelLevelStatusData;
	};
}
