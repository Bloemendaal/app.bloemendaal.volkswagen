import type { FetchData } from "../../api/fetch.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup from "../capability-group.mjs";
import type { Processable } from "../processable.mjs";
import TargetSocCapability from "./target-soc.mjs";

export default class ChargingSettingsCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "charging_settings";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | undefined {
		return capabilities.charging?.chargingSettings?.value?.carCapturedTimestamp;
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [new TargetSocCapability(this.volkswagenDevice)];
	}
}
