import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class OilServiceDueDaysCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "oil_service_due_days";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const dueDays =
			capabilities.vehicleHealthInspection?.maintenanceStatus?.value
				?.oilServiceDue_days;

		if (!this.isNumber(dueDays)) {
			throw new InvalidValueError(dueDays);
		}

		return dueDays;
	}
}
