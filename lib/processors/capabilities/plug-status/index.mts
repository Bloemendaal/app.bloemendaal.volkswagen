import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import IsPlugConnectedCapability from "./is-plug-connected.mjs";

export default class PlugStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "plug_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | null {
		return (
			capabilities.charging?.plugStatus?.value?.carCapturedTimestamp ?? null
		);
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
    return [new IsPlugConnectedCapability(this.baseDevice)];
	}
}
