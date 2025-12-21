import type { FetchData } from "../../api/fetch.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup from "../capability-group.mjs";
import type { Processable } from "../processable.mjs";
import MeasureBatteryTemperatureMaxCapability from "./measure-battery-temperature-max.mjs";
import MeasureBatteryTemperatureMinCapability from "./measure-battery-temperature-min.mjs";

export default class TemperatureBatteryStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "temperature_battery_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | undefined {
		return capabilities.measurements?.temperatureBatteryStatus?.value
			?.carCapturedTimestamp;
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
			new MeasureBatteryTemperatureMinCapability(this.volkswagenDevice),
			new MeasureBatteryTemperatureMaxCapability(this.volkswagenDevice),
		];
	}
}
