import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
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

	public override async setter(_fetchData: FetchData): Promise<void> {
		this.device.setCapabilityOptions(this.getCapabilityName(), {
			title: this.device.homey.__("capabilities.measure_range.title", {
				name: this.device.homey.__(
					"capabilities.measure_range.variables.adblue",
				),
			}),
		});
	}
}
