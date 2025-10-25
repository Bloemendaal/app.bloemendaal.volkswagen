type Integer = number;
type FloatString = string;
type DateTimeString = string;
type PossiblyUnknownString = string;

export interface AccessCapabilitiesData {
	accessStatus: {
		value: {
			overallStatus: "safe" | PossiblyUnknownString;
			carCapturedTimestamp: DateTimeString;
			doors: {
				name:
					| "bonnet"
					| "trunk"
					| "rearRight"
					| "rearLeft"
					| "frontRight"
					| "frontLeft";
				status: ("closed" | "locked" | PossiblyUnknownString)[];
			}[];
			windows: {
				name:
					| "sunRoof"
					| "roofCover"
					| "sunRoofRear"
					| "frontLeft"
					| "frontRight"
					| "rearLeft"
					| "rearRight";
				status: ("closed" | "unsupported" | PossiblyUnknownString)[];
				windowOpen_pct?: Integer;
			};
			doorLockStatus: "locked" | PossiblyUnknownString;
		};
	};
}

export interface ChargingCapabilitiesData {
	batteryStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			currentSOC_pct: Integer;
			cruisingRangeElectric_km: Integer;
		};
	};
	chargingStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			remainingChargingTimeToComplete_min: Integer;
			chargingState:
				| "off"
				| "ready_for_charging"
				| "charging"
				| "conservation"
				| "error"
				| "unsupported"
				| "discharging";
			chargeMode: "manual" | PossiblyUnknownString;
			chargePower_kW: Integer;
			chargeRate_kmph: Integer;
			chargeType: "invalid" | PossiblyUnknownString;
			chargingSettings: "default" | PossiblyUnknownString;
			chargingScenario: "errorChargingSystem" | PossiblyUnknownString;
		};
	};
	chargingSettings: {
		value: {
			carCapturedTimestamp: DateTimeString;
			maxChargeCurrentAC: "maximum" | PossiblyUnknownString;
			autoUnlockPlugWhenCharged: "off" | PossiblyUnknownString;
			autoUnlockPlugWhenChargedAC: "off" | PossiblyUnknownString;
			targetSOC_pct: Integer;
		};
	};
	plugStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			plugConnectionState: "connected" | PossiblyUnknownString;
			plugLockState: "unlocked" | PossiblyUnknownString;
			externalPower: "unavailable" | PossiblyUnknownString;
			ledColor: "green" | PossiblyUnknownString;
		};
	};
	chargeMode: {
		value: {
			preferredChargeMode: "manual" | PossiblyUnknownString;
			availableChargeModes: ("manual" | PossiblyUnknownString)[];
		};
	};
}

export interface ClimatisationCapabilitiesData {
	climatisationSettings: {
		value: {
			carCapturedTimestamp: DateTimeString;
			targetTemperature_C: Integer;
			targetTemperature_F: Integer;
			unitInCar: "celsius" | "fahrenheit";
			climatizationAtUnlock: boolean;
			windowHeatingEnabled: boolean;
			zoneFrontLeftEnabled: boolean;
			zoneFrontRightEnabled: boolean;
		};
	};
	climatisationStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			remainingClimatisationTime_min: Integer;
			climatisationState: "off" | PossiblyUnknownString;
		};
	};
	windowHeatingStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			windowHeatingStatus: {
				windowLocation: "front" | "rear";
				windowHeatingState: "off" | PossiblyUnknownString;
			}[];
		};
	};
}

export interface FuelStatusCapabilitiesData {
	rangeStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			carType: "electric" | PossiblyUnknownString;
			primaryEngine: {
				type: "electric" | PossiblyUnknownString;
				currentSOC_pct: Integer;
				remainingRange_km: Integer;
			};
			totalRange_km: Integer;
		};
	};
}

export interface MeasurementsCapabilitiesData {
	rangeStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
		};
	};
	odometerStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			odometer: Integer;
		};
	};
	temperatureBatteryStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			temperatureHvBatteryMin_K: FloatString;
			temperatureHvBatteryMax_K: FloatString;
		};
	};
	fuelLevelStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			primaryEngineType: "electric" | PossiblyUnknownString;
			carType: "electric" | PossiblyUnknownString;
		};
	};
}

export interface ReadinessCapabilitiesData {
	readinessStatus: {
		value: {
			connectionState: {
				isOnline: boolean;
				isActive: boolean;
				batteryPowerLevel: "comfort" | PossiblyUnknownString;
				dailyPowerBudgetAvailable: boolean;
			};
			connectionWarning: {
				insufficientBatteryLevelWarning: boolean;
				dailyPowerBudgetWarning: boolean;
			};
		};
	};
}

export interface VehicleLightsCapabilitiesData {
	lightsStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			lights: {
				name: "right" | "left";
				status: "off" | PossiblyUnknownString;
			}[];
		};
	};
}

export interface SelectiveStatusCapabilitiesData {
	access: AccessCapabilitiesData;
	activeventilation: unknown;
	automation: unknown;
	auxiliaryheating: unknown;
	batteryChargingCare: unknown;
	batterySupport: unknown;
	charging: ChargingCapabilitiesData;
	chargingProfiles: unknown;
	climatisation: ClimatisationCapabilitiesData;
	climatisationTimers: unknown;
	departureTimers: unknown;
	fuelStatus: FuelStatusCapabilitiesData;
	lvBattery: unknown;
	measurements: MeasurementsCapabilitiesData;
	oilLevel: unknown;
	readiness: ReadinessCapabilitiesData;
	userCapabilities: unknown;
	vehicleHealthInspection: unknown;
	vehicleHealthWarnings: unknown;
	vehicleLights: VehicleLightsCapabilitiesData;
}

export const selectiveStatusCapabilities: (keyof SelectiveStatusCapabilitiesData)[] =
	[
		"access",
		"activeventilation",
		"automation",
		"auxiliaryheating",
		"batteryChargingCare",
		"batterySupport",
		"charging",
		"chargingProfiles",
		"climatisation",
		"climatisationTimers",
		"departureTimers",
		"fuelStatus",
		"lvBattery",
		"measurements",
		"oilLevel",
		"readiness",
		"userCapabilities",
		"vehicleHealthInspection",
		"vehicleHealthWarnings",
		"vehicleLights",
	];
