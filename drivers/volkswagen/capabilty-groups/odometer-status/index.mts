import type { DateTimeString } from "../../api/types.mjs";
import type { VehicleData } from "../../device.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
import MeterOdometerCapability from "./meter-odometer.mjs";

export default class OdometerStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "odometer_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: VehicleData): DateTimeString | undefined {
		return capabilities.measurements?.odometerStatus?.value
			?.carCapturedTimestamp;
	}

	protected async getCapabilities(
		_vehicleData: VehicleData,
	): Promise<AnyCapability[]> {
		return [new MeterOdometerCapability(this.volkswagenDevice)];
	}
}
