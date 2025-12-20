import type { VehicleData } from "../../device.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
import ButtonFlashCapability from "./button-flash.mjs";
import ButtonHonkFlashCapability from "./button-honk-flash.mjs";
import ButtonWakeCapability from "./button-wake.mjs";
import ButtonWakeRefreshCapability from "./button-wake-refresh.mjs";

export default class UserCapabilitiesCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "user_capabilities";
	}

	protected getCapabilityTimestamp(
		_vehicleData: VehicleData,
	): DateTimeString | undefined {
		return undefined;
	}

	protected async getCapabilities(
		_vehicleData: VehicleData,
	): Promise<AnyCapability[]> {
		return [
			new ButtonFlashCapability(this.volkswagenDevice),
			new ButtonHonkFlashCapability(this.volkswagenDevice),
			new ButtonWakeCapability(this.volkswagenDevice),
			new ButtonWakeRefreshCapability(this.volkswagenDevice),
		];
	}
}
