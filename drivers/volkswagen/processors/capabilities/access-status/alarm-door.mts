import type { FetchData } from "../../../api/fetch.mjs";
import type VolkswagenDevice from "../../../device.mjs";

import InvalidValueError from "../../../errors/invalid-value-error.mjs";
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

	public override async getter({ capabilities }: FetchData): Promise<boolean> {
		const door = capabilities.access?.accessStatus?.value?.doors.find(
			(door) => door.name === this.subCapabilityName,
		);

		if (!door || door.status.includes("unsupported")) {
			throw new InvalidValueError(door);
		}

		return door.status.includes("unlocked");
	}
}
