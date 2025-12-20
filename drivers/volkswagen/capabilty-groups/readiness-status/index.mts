import type { DateTimeString } from "../../api/types.mjs";
import type { VehicleData } from "../../device.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
import VehicleActiveCapability from "./vehicle-active.mjs";
import VehicleOnlineCapability from "./vehicle-online.mjs";

export default class ReadinessStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "readiness_status";
	}

	protected getCapabilityTimestamp(
		_vehicleData: VehicleData,
	): DateTimeString | undefined {
		return undefined;
	}

	protected async getCapabilities(
		_vehicleData: VehicleData,
	): Promise<AnyCapability[]> {
		return [
			new VehicleOnlineCapability(this.volkswagenDevice),
			new VehicleActiveCapability(this.volkswagenDevice),
		];
	}
}
