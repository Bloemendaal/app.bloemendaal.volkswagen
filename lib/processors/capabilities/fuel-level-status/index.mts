import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
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
		return [new MeasureFuelLevelCapability(this.baseDevice)];
	}
}
