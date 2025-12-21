import type { FetchData } from "../../api/fetch.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup from "../capability-group.mjs";
import type { Processable } from "../processable.mjs";
import MaintenanceDueDaysCapability from "./maintenance-due-days.mjs";

export default class MaintenanceStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "maintenance_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | null {
		return (
			capabilities.vehicleHealthInspection?.maintenanceStatus?.value
				?.carCapturedTimestamp ?? null
		);
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [new MaintenanceDueDaysCapability(this.volkswagenDevice)];
	}
}
