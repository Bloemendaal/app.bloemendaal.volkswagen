import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import VehicleActiveCapability from "./vehicle-active.mjs";
import VehicleOnlineCapability from "./vehicle-online.mjs";

export default class ReadinessStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "readiness_status";
	}

	protected getCapabilityTimestamp(): DateTimeString | null {
		return null;
	}

	protected async getProcessables(): Promise<Processable[]> {
		return [
			new VehicleOnlineCapability(this.device),
			new VehicleActiveCapability(this.device),
		];
	}
}
