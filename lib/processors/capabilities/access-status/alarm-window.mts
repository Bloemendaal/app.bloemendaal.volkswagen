import type { FetchData } from "../../../api/fetch.mjs";
import type VagDevice from "../../../drivers/vag-device.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class AlarmWindowCapability extends Capability<boolean> {
	constructor(
		device: VagDevice,
		private readonly subCapabilityName: string,
	) {
		super(device);
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
		this.device.setCapabilityOptions(this.getCapabilityName(), {
			title: this.device.homey.__("capabilities.alarm_window.title", {
				name: this.device.homey.__(
					`capabilities.alarm_window.variables.${this.subCapabilityName}`,
				),
			}),
			insightsTitleTrue: this.device.homey.__(
				"capabilities.alarm_window.insightsTitleTrue",
				{
					name: this.device.homey.__(
						`capabilities.alarm_window.variables.${this.subCapabilityName}`,
					),
				},
			),
			insightsTitleFalse: this.device.homey.__(
				"capabilities.alarm_window.insightsTitleFalse",
				{
					name: this.device.homey.__(
						`capabilities.alarm_window.variables.${this.subCapabilityName}`,
					),
				},
			),
		});
	}
}
