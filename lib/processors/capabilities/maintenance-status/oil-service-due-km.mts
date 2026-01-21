import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class OilServiceDueKmCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "oil_service_due_km";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const dueKm =
			capabilities.vehicleHealthInspection?.maintenanceStatus?.value
				?.oilServiceDue_km;

		if (!this.isNumber(dueKm)) {
			throw new InvalidValueError(dueKm);
		}

		return dueKm;
	}
}
