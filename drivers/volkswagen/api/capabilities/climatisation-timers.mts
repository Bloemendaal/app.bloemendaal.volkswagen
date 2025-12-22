import type { ApiResponse } from "../../types.mjs";
import type { ClimatisationTimerData } from "./automation.mjs";

export interface ClimatisationTimersCapabilitiesData {
	climatisationTimersStatus?: ApiResponse<ClimatisationTimerData>;
}
