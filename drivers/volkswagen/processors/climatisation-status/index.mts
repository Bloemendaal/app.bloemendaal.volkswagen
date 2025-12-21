import type { FetchData } from "../../api/fetch.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup from "../capability-group.mjs";
import type { Processable } from "../processable.mjs";
import ClimatisationOnOffCapability from "./climatisation-onoff.mjs";
import MeasureRemainingClimatisationTimeCapability from "./measure-remaining-climatisation-time.mjs";
import TargetTemperatureCapability from "./target-temperature.mjs";

export default class ClimatisationStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "climatisation_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | undefined {
		return capabilities.climatisation?.climatisationStatus?.value
			?.carCapturedTimestamp;
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
			new ClimatisationOnOffCapability(this.volkswagenDevice),
			new TargetTemperatureCapability(this.volkswagenDevice),
			new MeasureRemainingClimatisationTimeCapability(this.volkswagenDevice),
		];
	}
}
