import type { ApiResponse, DateTimeString, Integer } from "../../types.mjs";

export interface CapabilitiesStatusData {
	id: string;
	status?: Integer[];
	expirationDate?: DateTimeString;
	userDisablingAllowed: boolean;
}

export interface UserCapabilitiesData {
	capabilitiesStatus?: ApiResponse<CapabilitiesStatusData[]>;
}
