import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import EvChargingStateCapability from "./ev-charging-state.mjs";
import IsChargingCapability from "./is-charging.mjs";
import MeasureChargingPowerCapability from "./measure-charging-power.mjs";
import MeasureChargingRateCapability from "./measure-charging-rate.mjs";
import MeasureRemainingChargingTimeCapability from "./measure-remaining-charging-time.mjs";

export default class ChargingStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "charging_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | null {
		return (
			capabilities.charging?.chargingStatus?.value?.carCapturedTimestamp ?? null
		);
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
			new EvChargingStateCapability(this.device),
			new IsChargingCapability(this.device),
			new MeasureChargingPowerCapability(this.device),
			new MeasureChargingRateCapability(this.device),
			new MeasureRemainingChargingTimeCapability(this.device),
		];
	}
}
