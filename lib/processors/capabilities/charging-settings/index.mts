import type { FetchData } from "../../../api/fetch.mjs";
import type { DateTimeString } from "../../../types.mjs";
import type { Processable } from "../../processable.mjs";
import CapabilityGroup from "../capability-group.mjs";
import ExpectsMaxChargingCurrentInAmpereCapability from "./expects-max-charging-current-in-ampere.mjs";
import MaxChargingCurrentCapability from "./max-charging-current.mjs";
import TargetSocCapability from "./target-soc.mjs";

export default class ChargingSettingsCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "charging_settings";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | null {
		return (
			capabilities.charging?.chargingSettings?.value?.carCapturedTimestamp ??
			null
		);
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
			new TargetSocCapability(this.device),
			new MaxChargingCurrentCapability(this.device),
			new ExpectsMaxChargingCurrentInAmpereCapability(this.device),
		];
	}
}
