import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.js";
import Capability from "./capability.js";

export default class MaintenanceStatus extends Capability {
	protected override getCapabilityName(): string {
		return "maintenance_status";
	}

	public override async addCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const promises: Promise<void>[] = [
			this.addTimestampCapability(
				capabilities.vehicleHealthInspection?.maintenanceStatus.value
					.carCapturedTimestamp,
			),
		];

		const validDueDays = this.isNumber(
			capabilities.vehicleHealthInspection?.maintenanceStatus.value
				.inspectionDue_days,
		);

		if (
			validDueDays &&
			!this.volkswagenDevice.hasCapability("maintenance_due_days")
		) {
			promises.push(
				this.volkswagenDevice.addCapability("maintenance_due_days"),
			);
		}

		await Promise.all(promises);
	}

	public override async setCapabilityValues(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const hasNewerTimestamp = await this.checkTimestamp(
			capabilities.vehicleHealthInspection?.maintenanceStatus.value
				.carCapturedTimestamp,
		);

		if (!hasNewerTimestamp) {
			return;
		}

		const dueDays =
			capabilities.vehicleHealthInspection?.maintenanceStatus.value
				.inspectionDue_days;

		if (
			this.isNumber(dueDays) &&
			this.volkswagenDevice.hasCapability("maintenance_due_days")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"maintenance_due_days",
				dueDays,
			);
		}
	}
}
