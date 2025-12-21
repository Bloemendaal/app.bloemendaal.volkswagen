import type { SelectiveStatusCapabilitiesData } from "./capabilities.mjs";
import type { ParkingPositionData } from "./parking-position.mjs";

export interface FetchData {
	capabilities: Partial<SelectiveStatusCapabilitiesData>;
	parkingPosition: ParkingPositionData | null;
}
