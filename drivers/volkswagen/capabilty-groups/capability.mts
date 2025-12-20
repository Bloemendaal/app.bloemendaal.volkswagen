import type { CapabilitiesStatusData } from "../api/capabilities/user-capabilities.mjs";
import type { FloatString } from "../api/types.mjs";
import type VolkswagenDevice from "../device.mjs";
import type { VehicleData } from "../device.mjs";
import InvalidValueError from "../errors/invalid-value-error.mjs";

export interface Options {
	title: string;
	getable: boolean;
	setable: boolean;
	uiComponent:
		| "toggle"
		| "slider"
		| "sensor"
		| "thermostat"
		| "media"
		| "color"
		| "battery"
		| "picker"
		| "ternary"
		| "button"
		| null;
}

type Getter<TValue> = (vehicleData: VehicleData) => Promise<TValue>;
type Setter<TValue> = (value: TValue) => Promise<void>;
type OptionsGetter = (vehicleData: VehicleData) => Promise<Partial<Options>>;

export default abstract class Capability<TValue> {
	constructor(protected readonly volkswagenDevice: VolkswagenDevice) {}

	/**
	 * The getter serves as both the getter and the guard for when a value is valid.
	 * @throws {InvalidValueError} When the value cannot be retrieved or is invalid
	 */
	public getter?: Getter<TValue>;

	/**
	 * Registers when the first time the getter returns a value.
	 * If the setter requires a guard but should not set a value,
	 * then the getter should return undefined.
	 */
	public setter?: Setter<TValue>;

	/**
	 * Optionally called after adding the capability to get options for it.
	 */
	public getOptions?: OptionsGetter;

	public async run(vehicleData: VehicleData): Promise<void> {
		if (!this.getter && !this.setter) {
			return;
		}

		try {
			const value = await this.getter?.(vehicleData);
			const name = this.getCapabilityName();

			if (!this.volkswagenDevice.hasCapability(name)) {
				await this.volkswagenDevice.addCapability(name);

				const options = await this.getOptions?.(vehicleData);

				if (options) {
					await this.volkswagenDevice.setCapabilityOptions(name, options);
				}

				if (this.setter) {
					this.volkswagenDevice.registerCapabilityListener(
						name,
						this.setter.bind(this),
					);
				}
			}

			if (value !== undefined) {
				await this.volkswagenDevice.setCapabilityValue(name, value);
			}
		} catch (error) {
			if (!(error instanceof InvalidValueError)) {
				throw error;
			}
		}
	}

	protected abstract getCapabilityName(): string;

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
