import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import MeasureBatteryTemperatureMaxCapability from "./measure-battery-temperature-max.mjs";
import MeasureBatteryTemperatureMinCapability from "./measure-battery-temperature-min.mjs";

export default class TemperatureBatteryStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "temperature_battery_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | null {
		return (
			capabilities.measurements?.temperatureBatteryStatus?.value
				?.carCapturedTimestamp ?? null
		);
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
			new MeasureBatteryTemperatureMinCapability(this.baseDevice),
			new MeasureBatteryTemperatureMaxCapability(this.baseDevice),
		];
	}
}
