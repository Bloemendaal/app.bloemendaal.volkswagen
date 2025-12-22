import type {
	DateTimeString,
	Integer,
	PossiblyUnknownString,
} from "../../types.mjs";

export interface BatteryStatusData {
	carCapturedTimestamp: DateTimeString;
	currentSOC_pct: Integer;
	cruisingRangeElectric_km: Integer;
}

export interface ChargingStatusData {
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
}

export interface ChargingSettingsData {
	carCapturedTimestamp: DateTimeString;
	maxChargeCurrentAC: "maximum" | "reduced" | PossiblyUnknownString;
	autoUnlockPlugWhenCharged: "on" | "off" | PossiblyUnknownString;
	autoUnlockPlugWhenChargedAC: "on" | "off" | PossiblyUnknownString;
	targetSOC_pct: Integer;
}

export interface PlugStatusData {
	carCapturedTimestamp: DateTimeString;
	plugConnectionState: "connected" | "disconnected" | PossiblyUnknownString;
	plugLockState: "locked" | "unlocked" | PossiblyUnknownString;
	externalPower: "unavailable" | "available" | PossiblyUnknownString;
	ledColor: "green" | "none" | PossiblyUnknownString;
}

export interface ChargeModeData {
	preferredChargeMode: "manual" | PossiblyUnknownString;
	availableChargeModes: ("manual" | PossiblyUnknownString)[];
}

export interface ChargingCareSettingsData {
	batteryCareMode: "activated" | "deactivated" | PossiblyUnknownString;
}

export interface ChargingCapabilitiesData {
	batteryStatus?: {
		value?: BatteryStatusData;
	};
	chargingStatus?: {
		value?: ChargingStatusData;
	};
	chargingSettings?: {
		value?: ChargingSettingsData;
	};
	plugStatus?: {
		value?: PlugStatusData;
	};
	chargeMode?: {
		value?: ChargeModeData;
	};
	chargingCareSettings?: {
		value?: ChargingCareSettingsData;
	};
}
