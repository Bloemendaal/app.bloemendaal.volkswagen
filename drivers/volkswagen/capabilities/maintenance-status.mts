import Capability, { type VehicleData } from "./capability.mjs";

export default class MaintenanceStatus extends Capability {
	protected override getCapabilityName(): string {
		return "maintenance_status";
	}

	public override async addCapabilities({
		capabilities,
	}: VehicleData): Promise<void> {
		await this.addTimestampCapability(
			capabilities.vehicleHealthInspection?.maintenanceStatus?.value
				.carCapturedTimestamp,
		);

		const validDueDays = this.isNumber(
			capabilities.vehicleHealthInspection?.maintenanceStatus?.value
				.inspectionDue_days,
		);

		if (
			validDueDays &&
			!this.volkswagenDevice.hasCapability("maintenance_due_days")
		) {
			await this.volkswagenDevice.addCapability("maintenance_due_days");
		}
	}

	public override async setCapabilityValues({
		capabilities,
	}: VehicleData): Promise<void> {
		const hasNewerTimestamp = await this.checkTimestamp(
			capabilities.vehicleHealthInspection?.maintenanceStatus?.value
				.carCapturedTimestamp,
		);

		if (!hasNewerTimestamp) {
			return;
		}

		const dueDays =
			capabilities.vehicleHealthInspection?.maintenanceStatus?.value
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
