import type { VehicleData } from "../../device.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
import ClimatisationOnOffCapability from "./climatisation-onoff.mjs";
import MeasureRemainingClimatisationTimeCapability from "./measure-remaining-climatisation-time.mjs";
import TargetTemperatureCapability from "./target-temperature.mjs";

export default class ClimatisationStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "climatisation_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: VehicleData): DateTimeString | undefined {
		return capabilities.climatisation?.climatisationStatus?.value
			?.carCapturedTimestamp;
	}

	protected async getCapabilities(
		_vehicleData: VehicleData,
	): Promise<AnyCapability[]> {
		return [
			new ClimatisationOnOffCapability(this.volkswagenDevice),
			new TargetTemperatureCapability(this.volkswagenDevice),
			new MeasureRemainingClimatisationTimeCapability(this.volkswagenDevice),
		];
	}
}
