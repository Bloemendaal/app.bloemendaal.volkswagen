import type { FetchData } from "../../api/fetch.mjs";
import type VagDevice from "../../drivers/vag-device.mjs";
import type { DateTimeString } from "../../types.mjs";
import type { Processable } from "../processable.mjs";
import Processor from "../processable.mjs";

export default abstract class CapabilityGroup implements Processable {
	constructor(protected readonly vagDevice: VagDevice) {}

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

		if (!this.vagDevice.hasCapability(capabilityId)) {
			await this.registerTimestampCapability(capabilityId);
		}

		const carCapturedTimestamp = new Date(timestamp ?? 0).getTime();

		const latestTimestamp = +this.vagDevice.getCapabilityValue(capabilityId);

		if (carCapturedTimestamp <= latestTimestamp) {
			return false;
		}

		await this.vagDevice.setCapabilityValue(capabilityId, carCapturedTimestamp);

		return true;
	}

	private async registerTimestampCapability(
		capabilityId: string,
	): Promise<void> {
		await this.vagDevice.addCapability(capabilityId);

		await this.vagDevice.setCapabilityOptions(capabilityId, {
			title: this.vagDevice.homey.__("capabilities.timestamp.title", {
				name: this.vagDevice.homey.__(
					`capabilities.timestamp.variables.${this.getCapabilityGroupName()}`,
				),
			}),
		});
	}
}
