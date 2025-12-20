import type { VehicleData } from "../../device.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
import MeasureBatteryTemperatureMaxCapability from "./measure-battery-temperature-max.mjs";
import MeasureBatteryTemperatureMinCapability from "./measure-battery-temperature-min.mjs";

export default class TemperatureBatteryStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "temperature_battery_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: VehicleData): DateTimeString | undefined {
		return capabilities.measurements?.temperatureBatteryStatus?.value
			?.carCapturedTimestamp;
	}

	protected async getCapabilities(
		_vehicleData: VehicleData,
	): Promise<AnyCapability[]> {
		return [
			new MeasureBatteryTemperatureMinCapability(this.volkswagenDevice),
			new MeasureBatteryTemperatureMaxCapability(this.volkswagenDevice),
		];
	}
}
