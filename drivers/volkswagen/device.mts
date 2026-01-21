import Homey from "homey";
import DebounceScheduler from "./api/debounce-scheduler.mjs";
import type { FetchData } from "./api/fetch.mjs";
import User from "./api/user.mjs";
import type Vehicle from "./api/vehicle.mjs";
import TranslatableError from "./errors/translatable-error.mjs";
import AccessStatusCapabilityGroup from "./processors/capabilities/access-status/index.mjs";
import BatteryStatusCapabilityGroup from "./processors/capabilities/battery-status/index.mjs";
import ChargingSettingsCapabilityGroup from "./processors/capabilities/charging-settings/index.mjs";
import ChargingStatusCapabilityGroup from "./processors/capabilities/charging-status/index.mjs";
import ClimatisationStatusCapabilityGroup from "./processors/capabilities/climatisation-status/index.mjs";
import FuelLevelStatusCapabilityGroup from "./processors/capabilities/fuel-level-status/index.mjs";
import MaintenanceStatusCapabilityGroup from "./processors/capabilities/maintenance-status/index.mjs";
import OdometerStatusCapabilityGroup from "./processors/capabilities/odometer-status/index.mjs";
import ParkingPositionCapabilityGroup from "./processors/capabilities/parking-position/index.mjs";
import PlugStatusCapabilityGroup from "./processors/capabilities/plug-status/index.mjs";
import ReadinessStatusCapabilityGroup from "./processors/capabilities/readiness-status/index.mjs";
import TemperatureBatteryStatusCapabilityGroup from "./processors/capabilities/temperature-battery-status/index.mjs";
import UserCapabilitiesCapabilityGroup from "./processors/capabilities/user-capabilities/index.mjs";
import ControlChargingFlow from "./processors/flows/control-charging.mjs";
import ControlClimatisationFlow from "./processors/flows/control-climatisation.mjs";
import TimestampUpdatedFlow from "./processors/flows/timestamp-updated.mjs";
import UpdateChargingSettingsFlow from "./processors/flows/update-charge-settings.mjs";
import Processor from "./processors/processable.mjs";
import EnergySetting from "./processors/settings/energy.mjs";

const MS_TO_MINUTES = 60 * 1000;
const DEFAULT_POLLING_INTERVAL_MINUTES = 10;

interface OnSettingsParams {
	oldSettings: { [key: string]: boolean | string | number | undefined | null };
	newSettings: { [key: string]: boolean | string | number | undefined | null };
	changedKeys: string[];
}

export default class VolkswagenDevice extends Homey.Device {
	private vehicle: Vehicle | null = null;

	private readonly debounceScheduler: DebounceScheduler<void> =
		new DebounceScheduler<void>(this.setCapabilities.bind(this));

	private readonly processor: Processor = new Processor([
		new EnergySetting(this),
		new AccessStatusCapabilityGroup(this),
		new BatteryStatusCapabilityGroup(this),
		new ChargingSettingsCapabilityGroup(this),
		new ChargingStatusCapabilityGroup(this),
		new ClimatisationStatusCapabilityGroup(this),
		new FuelLevelStatusCapabilityGroup(this),
		new MaintenanceStatusCapabilityGroup(this),
		new OdometerStatusCapabilityGroup(this),
		new ParkingPositionCapabilityGroup(this),
		new PlugStatusCapabilityGroup(this),
		new ReadinessStatusCapabilityGroup(this),
		new TemperatureBatteryStatusCapabilityGroup(this),
		new UserCapabilitiesCapabilityGroup(this),
		new ControlChargingFlow(this),
		new ControlClimatisationFlow(this),
		new TimestampUpdatedFlow(this),
		new UpdateChargingSettingsFlow(this),
	]);

	public async onInit(): Promise<void> {
		const vehicle = await this.getVehicle();
		vehicle.onSettingsUpdate(this.setSettings.bind(this));

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
			this.vehicle?.setSPin(newSettings.sPin?.toString());
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

	public async getVehicle(): Promise<Vehicle> {
		if (this.vehicle) {
			return this.vehicle;
		}

		try {
			const vehicles = await User.fromSettings(
				this.getSettings(),
			).getVehicles();

			const vehicle = vehicles.find(
				(vehicle) => vehicle.vin === this.getData().id,
			);

			if (!vehicle) {
				throw new Error("Vehicle not found");
			}

			this.vehicle = vehicle;
			return vehicle;
		} catch (error) {
			if (error instanceof TranslatableError) {
				throw new Error(this.homey.__(error.translationKey));
			}

			throw error;
		}
	}

	public async requestRefresh(
		minimum = 2000,
		maximum = minimum * 2,
	): Promise<void> {
		return await this.debounceScheduler.schedule({ minimum, maximum });
	}

	private async fetchVehicleData(
		vehicle: Vehicle | null = null,
	): Promise<FetchData> {
		if (!vehicle) {
			vehicle = await this.getVehicle();
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
