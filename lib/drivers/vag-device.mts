import Homey from "homey";
import DebounceScheduler from "#lib/api/debounce-scheduler.mjs";
import type { FetchData } from "#lib/api/fetch.mjs";
import type VagUser from "#lib/api/users/vag-user.mjs";
import type VagVehicle from "#lib/api/vehicles/vag-vehicle.mjs";
import TranslatableError from "#lib/errors/translatable-error.mjs";
import type Processor from "#lib/processors/processable.mjs";

const MS_TO_MINUTES = 60 * 1000;
const DEFAULT_POLLING_INTERVAL_MINUTES = 10;

interface OnSettingsParams {
	oldSettings: { [key: string]: boolean | string | number | undefined | null };
	newSettings: { [key: string]: boolean | string | number | undefined | null };
	changedKeys: string[];
}

/**
 * Base device class for all VAG Group vehicles
 * Provides common functionality for Volkswagen, SEAT, Cupra, and Skoda
 *
 * @template TUser - The specific User class for the brand (extends BaseUser)
 * @template TVehicle - The specific Vehicle class for the brand (extends BaseVehicle)
 */
export default abstract class VagDevice extends Homey.Device {
	private vehicle: VagVehicle | null = null;

	private readonly debounceScheduler: DebounceScheduler<void> =
		new DebounceScheduler<void>(this.setCapabilities.bind(this));

	protected abstract readonly processor: Processor;

	protected abstract createUser(): VagUser;

	/**
	 * Get vehicle from API using the brand-specific User class
	 */
	protected async getVehicleFromApi(): Promise<VagVehicle> {
		try {
			const user = this.createUser();
			const vehicles = await user.getVehicles();

			const vehicle = vehicles.find(
				(vehicle) => vehicle.vin === this.getData().id,
			);

			if (!vehicle) {
				throw new Error("Vehicle not found");
			}

			return vehicle;
		} catch (error) {
			if (error instanceof TranslatableError) {
				throw new Error(this.homey.__(error.translationKey));
			}

			throw error;
		}
	}

	public async onInit(): Promise<void> {
		const vehicle = await this.getVehicle();
		vehicle.authenticator.onSettingsUpdate(this.setSettings.bind(this));

		const fetchData = await this.fetchVehicleData(vehicle);

		await this.processor.register(fetchData);
		await this.setCapabilities(fetchData).catch(this.error.bind(this));

		const intervalDelay =
			MS_TO_MINUTES *
			+(this.getSettings().pollingInterval || DEFAULT_POLLING_INTERVAL_MINUTES);

		this.debounceScheduler.startInterval(intervalDelay);
	}

	public async onSettings({
		newSettings,
		changedKeys,
	}: OnSettingsParams): Promise<void> {
		if (changedKeys.includes("sPin")) {
			this.vehicle?.authenticator.setSPin(newSettings.sPin?.toString() ?? null);
		}

		if (changedKeys.includes("email") || changedKeys.includes("password")) {
			this.vehicle = null;
			await this.debounceScheduler.schedule();
		}

		if (changedKeys.includes("pollingInterval")) {
			const interval =
				MS_TO_MINUTES *
				+(newSettings.pollingInterval || DEFAULT_POLLING_INTERVAL_MINUTES);

			this.debounceScheduler.startInterval(interval);
		}

		if (changedKeys.includes("enableLogging") && newSettings.enableLogging) {
			// We intentionally do not await this because Homey won't apply the settings until this method resolves
			this.requestRefresh(1000, 4000);
		}
	}

	public async onUninit(): Promise<void> {
		await this.onDeleted();
	}

	public async onDeleted(): Promise<void> {
		this.debounceScheduler.destroy();
	}

	public errorAndThrow(error: unknown): never {
		this.error(error);
		throw error;
	}

	public async getVehicle(): Promise<VagVehicle> {
		if (this.vehicle) {
			return this.vehicle;
		}

		this.vehicle = await this.getVehicleFromApi();
		return this.vehicle;
	}

	public async requestRefresh(
		minimum = 2000,
		maximum = minimum * 2,
	): Promise<void> {
		return await this.debounceScheduler.schedule({ minimum, maximum });
	}

	private async fetchVehicleData(
		vehicle: VagVehicle | null = null,
	): Promise<FetchData> {
		if (!vehicle) {
			vehicle = await this.getVehicle();
			vehicle.authenticator.onSettingsUpdate(this.setSettings.bind(this));
		}

		const capabilities = await vehicle.getVehicleCapabilities();
		const parkingPosition = await vehicle
			.getParkingPosition()
			.catch((error) => {
				this.error(error);
				return null;
			});

		return { capabilities, parkingPosition };
	}

	private async setCapabilities(
		fetchData: FetchData | null = null,
	): Promise<void> {
		if (!fetchData) {
			fetchData = await this.fetchVehicleData().catch(
				this.errorAndThrow.bind(this),
			);
		}

		if (this.getSetting("enableLogging")) {
			this.log(`Fetched data: ${JSON.stringify(fetchData)}`);
		}

		await this.processor.run(fetchData).catch(this.errorAndThrow.bind(this));
	}
}
