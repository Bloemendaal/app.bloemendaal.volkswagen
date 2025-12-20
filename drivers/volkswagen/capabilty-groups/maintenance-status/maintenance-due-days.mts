import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MaintenanceDueDaysCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "maintenance_due_days";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<number> => {
		const dueDays =
			capabilities.vehicleHealthInspection?.maintenanceStatus?.value
				?.inspectionDue_days;

		if (!this.isNumber(dueDays)) {
			throw new InvalidValueError(dueDays);
		}

		return dueDays;
	};
}
