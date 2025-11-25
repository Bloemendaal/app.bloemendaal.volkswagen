import type { CapabilitiesStatusData } from "../api/capabilities/user-capabilities.mjs";
import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.mjs";
import type { ParkingPositionData } from "../api/parking-position.mjs";
import type { DateTimeString, FloatString } from "../api/types.mjs";
import type VolkswagenDevice from "../device.mjs";

export interface VehicleData {
	capabilities: Partial<SelectiveStatusCapabilitiesData>;
	parkingPosition: ParkingPositionData | null;
}

export default abstract class Capability {
	constructor(protected readonly volkswagenDevice: VolkswagenDevice) {}

	public async addCapabilities(_vehicleData: VehicleData): Promise<void> {
		// Default implementation does nothing
	}

	public async setCapabilityValues(_vehicleData: VehicleData): Promise<void> {
		// Default implementation does nothing
	}

	public async registerCapabilityListeners(
		_vehicleData: VehicleData,
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

	protected async can(
		capacityId: string,
		capabilities: CapabilitiesStatusData[] = [],
	): Promise<boolean> {
		const callback = ({ id }: CapabilitiesStatusData) => id === capacityId;

		if (capabilities.some(callback)) {
			return true;
		}

		const vehicle = await this.volkswagenDevice.getVehicle();

		return vehicle.capabilities.some(callback);
	}

	protected isNumber(value: unknown): value is number {
		return typeof value === "number" && !Number.isNaN(value);
	}

	protected isFloatString(value: unknown): value is FloatString {
		return typeof value === "string" && !Number.isNaN(Number.parseFloat(value));
	}
}
