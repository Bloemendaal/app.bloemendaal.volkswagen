import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.js";
import type { DateTimeString } from "../api/types.js";
import type VolkswagenDevice from "../device.js";

export default abstract class Capability {
	constructor(protected readonly volkswagenDevice: VolkswagenDevice) {}

	public async addCapabilities(
		_selectiveStatusCapabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		// Default implementation does nothing
	}

	public async setCapabilityValues(
		_selectiveStatusCapabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		// Default implementation does nothing
	}

	public async registerCapabilityListeners(
		_selectiveStatusCapabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		// Default implementation does nothing
	}

	protected abstract getCapabilityName(): string;

	protected async addTimestampCapability(
		timestamp: DateTimeString | null = null,
	): Promise<void> {
		const date = new Date(timestamp ?? 0);

		if (!date.getTime()) {
			return;
		}

		const capabilityId = `timestamp.${this.getCapabilityName()}`;

		if (!this.volkswagenDevice.hasCapability(capabilityId)) {
			await this.volkswagenDevice.addCapability(capabilityId);

			await this.volkswagenDevice.setCapabilityOptions(capabilityId, {
				title: this.volkswagenDevice.homey.__("capabilities.timestamp.title", {
					name: this.volkswagenDevice.homey.__(
						`capabilities.timestamp.variables.${this.getCapabilityName()}`,
					),
				}),
			});
		}
	}

	protected async checkTimestamp(
		timestamp: DateTimeString | null = null,
	): Promise<boolean> {
		const capabilityId = `timestamp.${this.getCapabilityName()}`;

		if (!this.volkswagenDevice.hasCapability(capabilityId)) {
			return false;
		}

		const carCapturedTimestamp = new Date(timestamp ?? 0);

		const latestTimestamp =
			+this.volkswagenDevice.getCapabilityValue(capabilityId);

		if (carCapturedTimestamp.getTime() <= latestTimestamp) {
			return false;
		}

		await this.volkswagenDevice.setCapabilityValue(
			capabilityId,
			carCapturedTimestamp.getTime(),
		);

		return true;
	}
}
