import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureRangeDieselCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_range.diesel";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const dieselRange =
			capabilities.measurements?.rangeStatus?.value?.dieselRange;

		if (!this.isNumber(dieselRange)) {
			throw new InvalidValueError(dieselRange);
		}

		return dieselRange;
	}

	public override async setter(_fetchData: FetchData): Promise<void> {
		this.device.setCapabilityOptions(this.getCapabilityName(), {
			title: this.device.homey.__("capabilities.measure_range.title", {
				name: this.device.homey.__(
					"capabilities.measure_range.variables.diesel",
				),
			}),
		});
	}
}
