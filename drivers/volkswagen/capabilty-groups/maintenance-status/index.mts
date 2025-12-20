import type { VehicleData } from "../../device.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
import MaintenanceDueDaysCapability from "./maintenance-due-days.mjs";

export default class MaintenanceStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "maintenance_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: VehicleData): DateTimeString | undefined {
		return capabilities.vehicleHealthInspection?.maintenanceStatus?.value
			?.carCapturedTimestamp;
	}

	protected async getCapabilities(
		_vehicleData: VehicleData,
	): Promise<AnyCapability[]> {
		return [new MaintenanceDueDaysCapability(this.volkswagenDevice)];
	}
}
