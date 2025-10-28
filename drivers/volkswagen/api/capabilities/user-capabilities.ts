import type { DateTimeString, Integer } from "../types.js";

export interface CapabilitiesStatusData {
	id: string;
	status?: Integer[];
	expirationDate?: DateTimeString;
	userDisablingAllowed: boolean;
}

export interface UserCapabilitiesData {
	capabilitiesStatus: {
		value: CapabilitiesStatusData[];
	};
}
