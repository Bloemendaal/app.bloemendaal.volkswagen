import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
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
      new TargetSocCapability(this.baseDevice),
      new MaxChargingCurrentCapability(this.baseDevice),
      new ExpectsMaxChargingCurrentInAmpereCapability(this.baseDevice),
		];
	}
}
