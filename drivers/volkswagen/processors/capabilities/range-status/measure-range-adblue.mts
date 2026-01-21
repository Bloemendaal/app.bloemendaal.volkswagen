import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureRangeAdBlueCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_range.adblue";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const adBlueRange =
			capabilities.measurements?.rangeStatus?.value?.adBlueRange;

		if (!this.isNumber(adBlueRange)) {
			throw new InvalidValueError(adBlueRange);
		}

		return adBlueRange;
	}
}
