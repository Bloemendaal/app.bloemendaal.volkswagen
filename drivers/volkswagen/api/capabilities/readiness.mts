import type { PossiblyUnknownString } from "../types.mjs";

export interface ConnectionState {
	isOnline: boolean;
	isActive: boolean;
	batteryPowerLevel: "comfort" | PossiblyUnknownString;
	dailyPowerBudgetAvailable: boolean;
}

export interface ConnectionWarning {
	insufficientBatteryLevelWarning: boolean;
	dailyPowerBudgetWarning: boolean;
}

export interface ReadinessStatus {
	connectionState: ConnectionState;
	connectionWarning: ConnectionWarning;
}

export interface ReadinessCapabilitiesData {
	readinessStatus?: {
		value?: ReadinessStatus;
	};
}
