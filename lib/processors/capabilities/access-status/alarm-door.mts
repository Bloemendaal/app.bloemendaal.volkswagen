import type VagDevice from "#lib/api/drivers/base-device.mjs";
import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class AlarmDoorCapability extends Capability<boolean> {
	constructor(
		device: VagDevice,
		private readonly subCapabilityName: string,
	) {
		super(device);
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

	public override async setter(_fetchData: FetchData): Promise<void> {
		this.device.setCapabilityOptions(this.getCapabilityName(), {
			title: this.device.homey.__("capabilities.alarm_door.title", {
				name: this.device.homey.__(
					`capabilities.alarm_door.variables.${this.subCapabilityName}`,
				),
			}),
			insightsTitleTrue: this.device.homey.__(
				"capabilities.alarm_door.insightsTitleTrue",
				{
					name: this.device.homey.__(
						`capabilities.alarm_door.variables.${this.subCapabilityName}`,
					),
				},
			),
			insightsTitleFalse: this.device.homey.__(
				"capabilities.alarm_door.insightsTitleFalse",
				{
					name: this.device.homey.__(
						`capabilities.alarm_door.variables.${this.subCapabilityName}`,
					),
				},
			),
		});
	}
}
