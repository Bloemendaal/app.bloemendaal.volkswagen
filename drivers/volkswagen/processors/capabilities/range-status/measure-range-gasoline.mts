import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureRangeGasolineCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_range.gasoline";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const gasolineRange =
			capabilities.measurements?.rangeStatus?.value?.gasolineRange;

		if (!this.isNumber(gasolineRange)) {
			throw new InvalidValueError(gasolineRange);
		}

		return gasolineRange;
	}
}
