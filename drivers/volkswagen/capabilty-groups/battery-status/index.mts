import type { VehicleData } from "../../device.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
import MeasureBatteryCapability from "./measure-battery.mjs";
import MeasureBatteryPercentageCapability from "./measure-battery-percentage.mjs";
import MeasureBatteryUntilFullCapability from "./measure-battery-until-full.mjs";
import MeasureBatteryUntilTargetSocCapability from "./measure-battery-until-target-soc.mjs";
import MeasureRangeCapability from "./measure-range.mjs";

export default class BatteryStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "battery_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: VehicleData): DateTimeString | undefined {
		return capabilities.charging?.batteryStatus?.value?.carCapturedTimestamp;
	}

	protected async getCapabilities(
		_vehicleData: VehicleData,
	): Promise<AnyCapability[]> {
		return [
			new MeasureRangeCapability(this.volkswagenDevice),
			new MeasureBatteryCapability(this.volkswagenDevice),
			new MeasureBatteryUntilFullCapability(this.volkswagenDevice),
			new MeasureBatteryUntilTargetSocCapability(this.volkswagenDevice),
			new MeasureBatteryPercentageCapability(this.volkswagenDevice),
		];
	}
}
