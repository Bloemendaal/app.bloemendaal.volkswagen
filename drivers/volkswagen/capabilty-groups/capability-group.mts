import type { DateTimeString } from "../api/types.mjs";
import type VolkswagenDevice from "../device.mjs";
import type { VehicleData } from "../device.mjs";
import type Capability from "./capability.mjs";

// biome-ignore lint/suspicious/noExplicitAny: it doesn't matter what value the capability holds for the group
export type AnyCapability = Capability<any>;

export default abstract class CapabilityGroup {
	constructor(protected readonly volkswagenDevice: VolkswagenDevice) {}

	public async run(vehicleData: VehicleData): Promise<void> {
		const hasNewerTimestamp = await this.addTimestampCapability(
			this.getCapabilityTimestamp(vehicleData),
		);

		const capabilities = await this.getCapabilities(vehicleData);

		for (const capability of capabilities) {
			await capability.run(vehicleData, {
				isOutdated: !hasNewerTimestamp,
			});
		}
	}

	protected abstract getCapabilityGroupName(): string;

	protected abstract getCapabilityTimestamp(
		vehicleData: VehicleData,
	): DateTimeString | undefined;

	protected abstract getCapabilities(
		vehicleData: VehicleData,
	): Promise<AnyCapability[]>;

	protected async addTimestampCapability(
		timestamp: DateTimeString | null = null,
	): Promise<boolean> {
		const date = new Date(timestamp ?? 0);

		if (!date.getTime()) {
			return false;
		}

		const capabilityId = `timestamp.${this.getCapabilityGroupName()}`;

		if (!this.volkswagenDevice.hasCapability(capabilityId)) {
			await this.registerTimestampCapability(capabilityId);
		}

		const carCapturedTimestamp = new Date(timestamp ?? 0).getTime();

		const latestTimestamp =
			+this.volkswagenDevice.getCapabilityValue(capabilityId);

		if (carCapturedTimestamp <= latestTimestamp) {
			return false;
		}

		await this.volkswagenDevice.setCapabilityValue(
			capabilityId,
			carCapturedTimestamp,
		);

		return true;
	}

	private async registerTimestampCapability(
		capabilityId: string,
	): Promise<void> {
		await this.volkswagenDevice.addCapability(capabilityId);

		await this.volkswagenDevice.setCapabilityOptions(capabilityId, {
			title: this.volkswagenDevice.homey.__("capabilities.timestamp.title", {
				name: this.volkswagenDevice.homey.__(
					`capabilities.timestamp.variables.${this.getCapabilityGroupName()}`,
				),
			}),
		});
	}
}
