import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class MeterOdometerCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "meter_odometer";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const odometer = capabilities.measurements?.odometerStatus?.value?.odometer;

		if (!this.isNumber(odometer)) {
			throw new InvalidValueError(odometer);
		}

		return odometer;
	}
}
