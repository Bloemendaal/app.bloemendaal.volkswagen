import type {
	DateTimeString,
	Integer,
	PossiblyUnknownString,
} from "../types.js";

export interface DoorAccessData {
	name:
		| "bonnet"
		| "trunk"
		| "rearRight"
		| "rearLeft"
		| "frontRight"
		| "frontLeft";
	status: ("closed" | "locked" | "unlocked" | PossiblyUnknownString)[];
}

export interface WindowAccessData {
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
}

export interface AccessStatusData {
	overallStatus: "safe" | "unsafe" | PossiblyUnknownString;
	carCapturedTimestamp: DateTimeString;
	doors: DoorAccessData[];
	windows: WindowAccessData[];
	doorLockStatus: "locked" | "unlocked" | PossiblyUnknownString;
}

export interface AccessCapabilitiesData {
	accessStatus: {
		value: AccessStatusData;
	};
}
