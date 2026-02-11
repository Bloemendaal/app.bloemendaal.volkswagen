import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import VehicleActiveCapability from "./vehicle-active.mjs";
import VehicleOnlineCapability from "./vehicle-online.mjs";

export default class ReadinessStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "readiness_status";
	}

	protected getCapabilityTimestamp(
		_fetchData: FetchData,
	): DateTimeString | null {
		return null;
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
      new VehicleOnlineCapability(this.baseDevice),
      new VehicleActiveCapability(this.baseDevice),
		];
	}
}
