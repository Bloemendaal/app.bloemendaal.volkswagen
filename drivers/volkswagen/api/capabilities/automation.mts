import type {
	DateTimeString,
	Integer,
	PossiblyUnknownString,
	TimeString,
	Weekday,
} from "../../types.mjs";

export interface RecurringTimerData {
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
}

export interface SingleTimerData {
	startDateTime: DateTimeString;
	targetDateTime: DateTimeString;
}

export interface TimerAutomationData {
	id: Integer;
	enabled: boolean;
	recurringTimer?: RecurringTimerData;
	singleTimer?: SingleTimerData;
}

export interface ClimatisationTimerData {
	carCapturedTimestamp: DateTimeString;
	timeInCar: DateTimeString;
	timers: TimerAutomationData[];
}

export interface NextChargingTimerData {
	id: Integer;
	targetSOCreachable: "invalid" | PossiblyUnknownString;
}

export interface OptionsData {
	autoUnlockPlugWhenCharged: "off" | PossiblyUnknownString;
	usePrivateCurrentEnabled: boolean;
}

export interface PreferredChargingTimeData {
	id: Integer;
	enabled: boolean;
	startTime: TimeString;
	endTime: TimeString;
}

export interface ProfileTimerData {
	id: Integer;
	enabled: boolean;
	climatisation: boolean;
	recurringTimer: RecurringTimerData;
}

export interface ProfileData {
	id: Integer;
	name: string;
	maxChargingCurrent: "max" | PossiblyUnknownString;
	minSOC_pct: Integer;
	targetSOC_pct: Integer;
	options: OptionsData;
	preferredChargingTimes: PreferredChargingTimeData[];
	timers: ProfileTimerData[];
}

export interface ChargingProfilesData {
	carCapturedTimestamp: DateTimeString;
	timeInCar: DateTimeString;
	nextChargingTimer: NextChargingTimerData;
	profiles: ProfileData[];
}

export interface AutomationCapabilitiesData {
	climatisationTimer?: {
		value?: ClimatisationTimerData;
	};
	chargingProfiles?: {
		value?: ChargingProfilesData;
	};
}
