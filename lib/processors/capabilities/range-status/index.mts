import type { FetchData } from "#lib/api/fetch.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import type { Processable } from "../../processable.mjs";
import CapabilityGroup from "../capability-group.mjs";
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
