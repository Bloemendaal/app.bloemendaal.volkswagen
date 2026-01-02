import type { FetchData } from "../../../api/fetch.mjs";
import type { DateTimeString } from "../../../types.mjs";
import type { Processable } from "../../processable.mjs";
import CapabilityGroup from "../capability-group.mjs";
import MeterOdometerCapability from "./meter-odometer.mjs";

export default class OdometerStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "odometer_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | null {
		return (
			capabilities.measurements?.odometerStatus?.value?.carCapturedTimestamp ??
			null
		);
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [new MeterOdometerCapability(this.vagDevice)];
	}
}
