import type {
	DateTimeString,
	FloatString,
	Integer,
	PossiblyUnknownString,
	TimeString,
	Weekday,
} from "./types.js";

export interface AccessCapabilitiesData {
	accessStatus: {
		value: {
			overallStatus: "safe" | "unsafe" | PossiblyUnknownString;
			carCapturedTimestamp: DateTimeString;
			doors: {
				name:
					| "bonnet"
					| "trunk"
					| "rearRight"
					| "rearLeft"
					| "frontRight"
					| "frontLeft";
				status: ("closed" | "locked" | "unlocked" | PossiblyUnknownString)[];
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
			}[];
			doorLockStatus: "locked" | "unlocked" | PossiblyUnknownString;
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
				| "readyForCharging"
				| "notReadyForCharging"
				| "conservation"
				| "chargePurposeReachedAndNotConservationCharging"
				| "chargePurposeReachedAndConservation"
				| "charging"
				| "error"
				| "unsupported"
				| "discharging";
			chargeMode: "manual" | PossiblyUnknownString;
			chargePower_kW: Integer;
			chargeRate_kmph: Integer;
			chargeType: "invalid" | PossiblyUnknownString;
			chargingSettings: "default" | PossiblyUnknownString;
			chargingScenario: "errorChargingSystem" | "off" | PossiblyUnknownString;
		};
	};
	chargingSettings: {
		value: {
			carCapturedTimestamp: DateTimeString;
			maxChargeCurrentAC: "maximum" | "reduced" | PossiblyUnknownString;
			autoUnlockPlugWhenCharged: "on" | "off" | PossiblyUnknownString;
			autoUnlockPlugWhenChargedAC: "on" | "off" | PossiblyUnknownString;
			targetSOC_pct: Integer;
		};
	};
	plugStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			plugConnectionState: "connected" | "disconnected" | PossiblyUnknownString;
			plugLockState: "locked" | "unlocked" | PossiblyUnknownString;
			externalPower: "unavailable" | "available" | PossiblyUnknownString;
			ledColor: "green" | "none" | PossiblyUnknownString;
		};
	};
	chargeMode: {
		value: {
			preferredChargeMode: "manual" | PossiblyUnknownString;
			availableChargeModes: ("manual" | PossiblyUnknownString)[];
		};
	};
	chargingCareSettings?: {
		value: {
			batteryCareMode: "activated" | "deactivated" | PossiblyUnknownString;
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

export interface AutomationCapabilitiesData {
	climatisationTimer?: {
		value: {
			carCapturedTimestamp: DateTimeString;
			timeInCar: DateTimeString;
			timers: {
				id: Integer;
				enabled: boolean;
				recurringTimer?: {
					startTime: TimeString;
					recurringOn: {
						mondays: boolean;
						tuesdays: boolean;
						wednesdays: boolean;
						thursdays: boolean;
						fridays: boolean;
						saturdays: boolean;
						sundays: boolean;
					};
					targetTime: TimeString;
					repetitionDays: Weekday[];
				};
				singleTimer?: {
					startDateTime: DateTimeString;
					targetDateTime: DateTimeString;
				};
			}[];
		};
	};
	chargingProfiles?: {
		value: {
			carCapturedTimestamp: DateTimeString;
			timeInCar: DateTimeString;
			nextChargingTimer: {
				id: Integer;
				targetSOCreachable: "invalid" | PossiblyUnknownString;
			};
			profiles: {
				id: Integer;
				name: string;
				maxChargingCurrent: "max" | PossiblyUnknownString;
				minSOC_pct: Integer;
				targetSOC_pct: Integer;
				options: {
					autoUnlockPlugWhenCharged: "off" | PossiblyUnknownString;
					usePrivateCurrentEnabled: boolean;
				};
				preferredChargingTimes: {
					id: Integer;
					enabled: boolean;
					startTime: TimeString;
					endTime: TimeString;
				}[];
				timers: {
					id: Integer;
					enabled: boolean;
					climatisation: boolean;
					recurringTimer: {
						startTime: TimeString;
						recurringOn: {
							mondays: boolean;
							tuesdays: boolean;
							wednesdays: boolean;
							thursdays: boolean;
							fridays: boolean;
							saturdays: boolean;
							sundays: boolean;
						};
						targetTime: TimeString;
						repetitionDays: string[];
					};
				}[];
			}[];
		};
	};
}

export interface BatteryChargingCareCapabilitiesData {
	chargingCareSettings: {
		value: {
			batteryCareMode: "activated" | PossiblyUnknownString;
		};
	};
}

export interface BatterySupportCapabilitiesData {
	batterySupportStatus: {
		value: {
			batterySupport: "disabled" | "enabled" | PossiblyUnknownString;
		};
	};
}

export interface ChargingProfilesCapabilitiesData {
	chargingProfilesStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			timeInCar: DateTimeString;
			nextChargingTimer: {
				id: Integer;
				targetSOCreachable: "invalid" | PossiblyUnknownString;
			};
			profiles: {
				id: Integer;
				name: string;
				maxChargingCurrent: "max" | PossiblyUnknownString;
				minSOC_pct: Integer;
				targetSOC_pct: Integer;
				options: {
					autoUnlockPlugWhenCharged: "off" | PossiblyUnknownString;
					usePrivateCurrentEnabled: boolean;
				};
				preferredChargingTimes: {
					id: Integer;
					enabled: boolean;
					startTime: TimeString;
					endTime: TimeString;
				}[];
				timers: {
					id: Integer;
					enabled: boolean;
					climatisation: boolean;
					recurringTimer: {
						startTime: TimeString;
						recurringOn: {
							mondays: boolean;
							tuesdays: boolean;
							wednesdays: boolean;
							thursdays: boolean;
							fridays: boolean;
							saturdays: boolean;
							sundays: boolean;
						};
						targetTime: TimeString;
						repetitionDays: string[];
					};
				}[];
			}[];
		};
	};
}

export interface ClimatisationTimersCapabilitiesData {
	climatisationTimersStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			timeInCar: DateTimeString;
			timers: {
				id: Integer;
				enabled: boolean;
				recurringTimer?: {
					startTime: TimeString;
					recurringOn: {
						mondays: boolean;
						tuesdays: boolean;
						wednesdays: boolean;
						thursdays: boolean;
						fridays: boolean;
						saturdays: boolean;
						sundays: boolean;
					};
					targetTime: TimeString;
					repetitionDays: string[];
				};
				singleTimer?: {
					startDateTime: DateTimeString;
					targetDateTime: DateTimeString;
				};
			}[];
		};
	};
}

export interface UserCapabilitiesData {
	capabilitiesStatus: {
		value: {
			id: string;
			status?: Integer[];
			expirationDate?: DateTimeString;
			userDisablingAllowed: boolean;
		}[];
	};
}

export interface VehicleHealthInspectionCapabilitiesData {
	maintenanceStatus: {
		value: {
			carCapturedTimestamp: DateTimeString;
			inspectionDue_days: Integer;
			mileage_km: Integer;
		};
	};
}

export interface VehicleHealthWarningsCapabilitiesData {
	warningLights: {
		value: {
			carCapturedTimestamp: DateTimeString;
			mileage_km: Integer;
		};
	};
}

export interface SelectiveStatusCapabilitiesData {
	access: AccessCapabilitiesData;
	activeventilation: unknown;
	automation: AutomationCapabilitiesData;
	auxiliaryheating: unknown;
	batteryChargingCare: BatteryChargingCareCapabilitiesData;
	batterySupport: BatterySupportCapabilitiesData;
	charging: ChargingCapabilitiesData;
	chargingProfiles: ChargingProfilesCapabilitiesData;
	climatisation: ClimatisationCapabilitiesData;
	climatisationTimers: ClimatisationTimersCapabilitiesData;
	departureTimers: unknown;
	fuelStatus: FuelStatusCapabilitiesData;
	lvBattery: unknown;
	measurements: MeasurementsCapabilitiesData;
	oilLevel: unknown;
	readiness: ReadinessCapabilitiesData;
	userCapabilities: UserCapabilitiesData;
	vehicleHealthInspection: VehicleHealthInspectionCapabilitiesData;
	vehicleHealthWarnings: VehicleHealthWarningsCapabilitiesData;
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
