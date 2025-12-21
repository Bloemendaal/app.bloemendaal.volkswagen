import type { FetchData } from "../../api/fetch.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup from "../capability-group.mjs";
import type { Processable } from "../processable.mjs";
import VehicleActiveCapability from "./vehicle-active.mjs";
import VehicleOnlineCapability from "./vehicle-online.mjs";

export default class ReadinessStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "readiness_status";
	}

	protected getCapabilityTimestamp(
		_fetchData: FetchData,
	): DateTimeString | undefined {
		return undefined;
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
			new VehicleOnlineCapability(this.volkswagenDevice),
			new VehicleActiveCapability(this.volkswagenDevice),
		];
	}
}
