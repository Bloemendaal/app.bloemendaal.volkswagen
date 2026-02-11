import type BaseDevice from "#lib/api/drivers/base-device.mjs";
import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class AlarmWindowCapability extends Capability<boolean> {
	constructor(
		baseDevice: BaseDevice,
		private readonly subCapabilityName: string,
	) {
		super(baseDevice);
	}

	protected getCapabilityName(): string {
		return `alarm_window.${this.subCapabilityName}`;
	}

	public override async getter({ capabilities }: FetchData): Promise<boolean> {
		const window = capabilities.access?.accessStatus?.value?.windows.find(
			(window) => window.name === this.subCapabilityName,
		);

		if (!window || window.status.includes("unsupported")) {
			throw new InvalidValueError(window);
		}

		return !window.status.includes("closed");
	}

	public override async setter(_fetchData: FetchData): Promise<void> {
		this.baseDevice.setCapabilityOptions(this.getCapabilityName(), {
			title: this.baseDevice.homey.__("capabilities.alarm_window.title", {
				name: this.baseDevice.homey.__(
					`capabilities.alarm_window.variables.${this.subCapabilityName}`,
				),
			}),
			insightsTitleTrue: this.baseDevice.homey.__(
				"capabilities.alarm_window.insightsTitleTrue",
				{
					name: this.baseDevice.homey.__(
						`capabilities.alarm_window.variables.${this.subCapabilityName}`,
					),
				},
			),
			insightsTitleFalse: this.baseDevice.homey.__(
				"capabilities.alarm_window.insightsTitleFalse",
				{
					name: this.baseDevice.homey.__(
						`capabilities.alarm_window.variables.${this.subCapabilityName}`,
					),
				},
			),
		});
	}
}
