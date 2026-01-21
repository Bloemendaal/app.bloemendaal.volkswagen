import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureRangeElectricCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_range.electric";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const electricRange =
			capabilities.measurements?.rangeStatus?.value?.electricRange;

		if (!this.isNumber(electricRange)) {
			throw new InvalidValueError(electricRange);
		}

		return electricRange;
	}
}
