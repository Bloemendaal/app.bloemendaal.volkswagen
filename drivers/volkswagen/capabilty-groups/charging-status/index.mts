import type { VehicleData } from "../../device.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
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
	}: VehicleData): DateTimeString | undefined {
		return capabilities.charging?.chargingStatus?.value?.carCapturedTimestamp;
	}

	protected async getCapabilities(
		__vehicleData: VehicleData,
	): Promise<AnyCapability[]> {
		return [
			new EvChargingStateCapability(this.volkswagenDevice),
			new IsChargingCapability(this.volkswagenDevice),
			new MeasureChargingPowerCapability(this.volkswagenDevice),
			new MeasureChargingRateCapability(this.volkswagenDevice),
			new MeasureRemainingChargingTimeCapability(this.volkswagenDevice),
		];
	}
}
