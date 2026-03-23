import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import ButtonFlashCapability from "./button-flash.mjs";
import ButtonHonkFlashCapability from "./button-honk-flash.mjs";
import ButtonWakeCapability from "./button-wake.mjs";
import ButtonWakeRefreshCapability from "./button-wake-refresh.mjs";

export default class UserCapabilitiesCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "user_capabilities";
	}

	protected getCapabilityTimestamp(): DateTimeString | null {
		return null;
	}

	protected async getProcessables(): Promise<Processable[]> {
		return [
			new ButtonFlashCapability(this.device),
			new ButtonHonkFlashCapability(this.device),
			new ButtonWakeCapability(this.device),
			new ButtonWakeRefreshCapability(this.device),
		];
	}
}
