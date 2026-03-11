import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
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

	protected async getProcessables(): Promise<Processable[]> {
		return [new MeterOdometerCapability(this.device)];
	}
}
