import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MaintenanceDueKmCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "maintenance_due_km";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const dueKm =
			capabilities.vehicleHealthInspection?.maintenanceStatus?.value
				?.inspectionDue_km;

		if (!this.isNumber(dueKm)) {
			throw new InvalidValueError(dueKm);
		}

		return dueKm;
	}
}
