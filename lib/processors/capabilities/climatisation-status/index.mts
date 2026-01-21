import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import ClimatisationOnOffCapability from "./climatisation-onoff.mjs";
import MeasureRemainingClimatisationTimeCapability from "./measure-remaining-climatisation-time.mjs";
import TargetTemperatureCapability from "./target-temperature.mjs";

export default class ClimatisationStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "climatisation_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | null {
		return (
			capabilities.climatisation?.climatisationStatus?.value
				?.carCapturedTimestamp ?? null
		);
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
			new ClimatisationOnOffCapability(this.device),
			new TargetTemperatureCapability(this.device),
			new MeasureRemainingClimatisationTimeCapability(this.device),
		];
	}
}
