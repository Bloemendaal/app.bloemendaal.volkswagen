import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import MeasureBatteryCapability from "./measure-battery.mjs";
import MeasureBatteryPercentageCapability from "./measure-battery-percentage.mjs";
import MeasureBatteryUntilFullCapability from "./measure-battery-until-full.mjs";
import MeasureBatteryUntilTargetSocCapability from "./measure-battery-until-target-soc.mjs";

export default class BatteryStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "battery_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | null {
		return (
			capabilities.charging?.batteryStatus?.value?.carCapturedTimestamp ?? null
		);
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
      new MeasureBatteryCapability(this.baseDevice),
      new MeasureBatteryUntilFullCapability(this.baseDevice),
      new MeasureBatteryUntilTargetSocCapability(this.baseDevice),
      new MeasureBatteryPercentageCapability(this.baseDevice),
		];
	}
}
