import type { FetchData } from "../../../api/fetch.mjs";
import type { DateTimeString } from "../../../types.mjs";
import type { Processable } from "../../processable.mjs";
import CapabilityGroup from "../capability-group.mjs";
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
			new EvChargingStateCapability(this.vagDevice),
			new IsChargingCapability(this.vagDevice),
			new MeasureChargingPowerCapability(this.vagDevice),
			new MeasureChargingRateCapability(this.vagDevice),
			new MeasureRemainingChargingTimeCapability(this.vagDevice),
		];
	}
}
