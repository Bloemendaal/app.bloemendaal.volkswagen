import type VolkswagenDevice from "../../device.mjs";
import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class AlarmDoorCapability extends Capability<boolean> {
	constructor(
		volkswagenDevice: VolkswagenDevice,
		private readonly subCapabilityName: string,
	) {
		super(volkswagenDevice);
	}

	protected getCapabilityName(): string {
		return `alarm_door.${this.subCapabilityName}`;
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<boolean> => {
		const door = capabilities.access?.accessStatus?.value?.doors.find(
			(door) => door.name === this.subCapabilityName,
		);

		if (!door || door.status.includes("unsupported")) {
			throw new InvalidValueError(door);
		}

		return door.status.includes("unlocked");
	};
}
