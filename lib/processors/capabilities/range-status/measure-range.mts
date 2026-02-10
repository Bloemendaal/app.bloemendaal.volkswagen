import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class MeasureRangeCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_range";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const totalRange =
			capabilities.measurements?.rangeStatus?.value?.totalRange_km;

		if (!this.isNumber(totalRange)) {
			throw new InvalidValueError(totalRange);
		}

		return totalRange;
	}
}
