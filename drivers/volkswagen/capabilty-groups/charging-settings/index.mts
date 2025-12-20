import type { DateTimeString } from "../../api/types.mjs";
import type { VehicleData } from "../../device.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
import TargetSocCapability from "./target-soc.mjs";

export default class ChargingSettingsCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "charging_settings";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: VehicleData): DateTimeString | undefined {
		return capabilities.charging?.chargingSettings?.value?.carCapturedTimestamp;
	}

	protected async getCapabilities(
		_vehicleData: VehicleData,
	): Promise<AnyCapability[]> {
		return [new TargetSocCapability(this.volkswagenDevice)];
	}
}
