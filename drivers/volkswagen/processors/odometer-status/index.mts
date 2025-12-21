import type { FetchData } from "../../api/fetch.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup from "../capability-group.mjs";
import type { Processable } from "../processable.mjs";
import MeterOdometerCapability from "./meter-odometer.mjs";

export default class OdometerStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "odometer_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | undefined {
		return capabilities.measurements?.odometerStatus?.value
			?.carCapturedTimestamp;
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [new MeterOdometerCapability(this.volkswagenDevice)];
	}
}
