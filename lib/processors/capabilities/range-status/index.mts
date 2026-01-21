import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import MeasureRangeCapability from "./measure-range.mjs";
import MeasureRangeAdBlueCapability from "./measure-range-adblue.mjs";
import MeasureRangeDieselCapability from "./measure-range-diesel.mjs";
import MeasureRangeElectricCapability from "./measure-range-electric.mjs";

export default class RangeStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "range_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | null {
		return (
			capabilities.measurements?.rangeStatus?.value?.carCapturedTimestamp ??
			null
		);
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
			new MeasureRangeCapability(this.device),
			new MeasureRangeAdBlueCapability(this.device),
			new MeasureRangeDieselCapability(this.device),
			new MeasureRangeElectricCapability(this.device),
		];
	}
}
