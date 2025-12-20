import type { DateTimeString } from "../../api/types.mjs";
import type { VehicleData } from "../../device.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
import IsPlugConnectedCapability from "./is-plug-connected.mjs";

export default class PlugStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "plug_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: VehicleData): DateTimeString | undefined {
		return capabilities.charging?.plugStatus?.value?.carCapturedTimestamp;
	}

	protected async getCapabilities(
		_vehicleData: VehicleData,
	): Promise<AnyCapability[]> {
		return [new IsPlugConnectedCapability(this.volkswagenDevice)];
	}
}
