import type { FetchData } from "../../api/fetch.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup from "../capability-group.mjs";
import type { Processable } from "../processable.mjs";
import EnergySetting from "./energy.mjs";

export default class RangeStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "range_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | null {
		return (
			capabilities.fuelStatus?.rangeStatus?.value?.carCapturedTimestamp ?? null
		);
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [new EnergySetting(this.volkswagenDevice)];
	}
}
