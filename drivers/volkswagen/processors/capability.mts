import type { CapabilitiesStatusData } from "../api/capabilities/user-capabilities.mjs";
import type { FetchData } from "../api/fetch.mjs";
import type VolkswagenDevice from "../device.mjs";
import InvalidValueError from "../errors/invalid-value-error.mjs";
import NotImplementedError from "../errors/not-implemented-error.mjs";
import type { FloatString } from "../types.mjs";
import type { Processable } from "./processable.mjs";

export interface RunOptions {
	isOutdated: boolean;
}

export default abstract class Capability<TValue> implements Processable {
	constructor(protected readonly volkswagenDevice: VolkswagenDevice) {}

	public async register(fetchData: FetchData): Promise<void> {
		if (this.volkswagenDevice.hasCapability(this.getCapabilityName())) {
			await this.setter(fetchData);
		}
	}

	public async run(fetchData: FetchData, options?: RunOptions): Promise<void> {
		const name = this.getCapabilityName();

		try {
			const value = await this.getter(fetchData);

			await this.addCapability(name, fetchData);

			if (this.shouldSetCapabilityValue(name, options)) {
				await this.volkswagenDevice.setCapabilityValue(name, value);
			}
		} catch (error) {
			if (error instanceof NotImplementedError) {
				await this.addCapability(name, fetchData);
				return;
			}

			if (error instanceof InvalidValueError) {
				return;
			}

			throw error;
		}
	}

	/**
	 * The getter serves as both the getter and the guard for when a value is valid.
	 * @throws {InvalidValueError} When the value cannot be retrieved or is invalid
	 * @throws {NotImplementedError} When the getter is not implemented
	 */
	protected async getter(_fetchData: FetchData): Promise<TValue> {
		throw new NotImplementedError();
	}

	/**
	 * The setter is called on initialization of the device when the capability
	 * already exists or when the capability is added.
	 */
	protected async setter(_fetchData: FetchData): Promise<void> {
		// Optional to implement
	}

	protected abstract getCapabilityName(): string;

	protected shouldSetCapabilityValue(
		name: string,
		options?: RunOptions,
	): boolean {
		if (!options?.isOutdated) {
			return true;
		}

		const currentValue = this.volkswagenDevice.getCapabilityValue(name);

		return currentValue === null || currentValue === undefined;
	}

	protected async addCapability(
		name: string,
		fetchData: FetchData,
	): Promise<void> {
		if (!this.volkswagenDevice.hasCapability(name)) {
			await this.volkswagenDevice.addCapability(name);
			await this.setter(fetchData);
		}
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
