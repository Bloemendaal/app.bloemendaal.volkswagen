import type { FetchData } from "../../api/fetch.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup from "../capability-group.mjs";
import type { Processable } from "../processable.mjs";
import IsPlugConnectedCapability from "./is-plug-connected.mjs";

export default class PlugStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "plug_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | undefined {
		return capabilities.charging?.plugStatus?.value?.carCapturedTimestamp;
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [new IsPlugConnectedCapability(this.volkswagenDevice)];
	}
}
