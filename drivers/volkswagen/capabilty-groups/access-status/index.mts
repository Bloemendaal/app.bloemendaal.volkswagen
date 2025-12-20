import type { VehicleData } from "../../device.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
import AlarmDoorCapability from "./alarm-door.mjs";
import AlarmGeneralCapability from "./alarm-general.mjs";
import AlarmWindowCapability from "./alarm-window.mjs";
import LockedCapability from "./locked.mjs";

export default class AccessStatusCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "access_status";
	}

	protected getCapabilityTimestamp({
		capabilities,
	}: VehicleData): DateTimeString | undefined {
		return capabilities.access?.accessStatus?.value?.carCapturedTimestamp;
	}

	protected async getCapabilities({
		capabilities,
	}: VehicleData): Promise<AnyCapability[]> {
		const capabilitiesList: AnyCapability[] = [
			new LockedCapability(this.volkswagenDevice),
			new AlarmGeneralCapability(this.volkswagenDevice),
		];

		const doors = capabilities.access?.accessStatus?.value?.doors ?? [];

		for (const door of doors) {
			capabilitiesList.push(
				new AlarmDoorCapability(this.volkswagenDevice, door.name),
			);
		}

		const windows = capabilities.access?.accessStatus?.value?.windows ?? [];

		for (const window of windows) {
			capabilitiesList.push(
				new AlarmWindowCapability(this.volkswagenDevice, window.name),
			);
		}

		return capabilitiesList;
	}
}
