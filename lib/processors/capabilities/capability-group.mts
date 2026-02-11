import type BaseDevice from "#lib/api/drivers/base-device.mjs";
import type { FetchData } from "#lib/api/fetch.mjs";
import Processor, { type Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";

export default abstract class CapabilityGroup implements Processable {
	constructor(protected readonly baseDevice: BaseDevice) {}

	public async register(fetchData: FetchData): Promise<void> {
		const capabilities = await this.getProcessables(fetchData);

		await new Processor(capabilities).register(fetchData);
	}

	public async run(fetchData: FetchData): Promise<void> {
		const hasNewerTimestamp = await this.addTimestampCapability(
			this.getCapabilityTimestamp(fetchData),
		);

		const capabilities = await this.getProcessables(fetchData);

		await new Processor(capabilities).run(fetchData, {
			isOutdated: !hasNewerTimestamp,
		});
	}

	protected abstract getCapabilityGroupName(): string;

	protected abstract getCapabilityTimestamp(
		fetchData: FetchData,
	): DateTimeString | null;

	protected abstract getProcessables(
		fetchData: FetchData,
	): Promise<Processable[]>;

	protected async addTimestampCapability(
		timestamp: DateTimeString | null,
	): Promise<boolean> {
		const date = new Date(timestamp ?? 0);

		if (!date.getTime()) {
			return false;
		}

		const capabilityId = `timestamp.${this.getCapabilityGroupName()}`;

		if (!this.baseDevice.hasCapability(capabilityId)) {
			await this.registerTimestampCapability(capabilityId);
		}

		const carCapturedTimestamp = new Date(timestamp ?? 0).getTime();

		const latestTimestamp = +this.baseDevice.getCapabilityValue(capabilityId);

		if (carCapturedTimestamp <= latestTimestamp) {
			return false;
		}

		await this.baseDevice.setCapabilityValue(
			capabilityId,
			carCapturedTimestamp,
		);

		return true;
	}

	private async registerTimestampCapability(
		capabilityId: string,
	): Promise<void> {
		await this.baseDevice.addCapability(capabilityId);

		await this.baseDevice.setCapabilityOptions(capabilityId, {
			title: this.baseDevice.homey.__("capabilities.timestamp.title", {
				name: this.baseDevice.homey.__(
					`capabilities.timestamp.variables.${this.getCapabilityGroupName()}`,
				),
			}),
		});
	}
}
