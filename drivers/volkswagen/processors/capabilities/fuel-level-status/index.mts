import type { FetchData } from "../../../api/fetch.mjs";
import type { DateTimeString } from "../../../types.mjs";
import type { Processable } from "../../processable.mjs";
import CapabilityGroup from "../capability-group.mjs";
import MeasureFuelLevelCapability from "./measure-fuel-level.mjs";

export default class FuelLevelStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "fuel_level_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: FetchData): DateTimeString | null {
		return (
			capabilities.measurements?.fuelLevelStatus?.value?.carCapturedTimestamp ??
			null
		);
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [new MeasureFuelLevelCapability(this.device)];
	}
}
