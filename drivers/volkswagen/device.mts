import Homey from "homey";
import DebounceScheduler from "./api/debounce-scheduler.mjs";
import TranslatableError from "./api/errors/translatable-error.mjs";
import User from "./api/user.mjs";
import type Vehicle from "./api/vehicle.mjs";
import Access from "./capabilities/access.mjs";
import BatteryStatus from "./capabilities/battery-status.mjs";
import type Capability from "./capabilities/capability.mjs";
import type { VehicleData } from "./capabilities/capability.mjs";
import ChargingSettings from "./capabilities/charging-settings.mjs";
import ChargingStatus from "./capabilities/charging-status.mjs";
import ClimatisationStatus from "./capabilities/climatisation-status.mjs";
import Coordinate from "./capabilities/coordinate.mjs";
import DistanceHome from "./capabilities/distance-home.mjs";
import HonkAndFlash from "./capabilities/hook-and-flash.mjs";
import MaintenanceStatus from "./capabilities/maintenance-status.mjs";
import OdometerStatus from "./capabilities/odometer-status.mjs";
import PlugStatus from "./capabilities/plug-status.mjs";
import ReadinessStatus from "./capabilities/readiness-status.mjs";
import TemperatureBatteryStatus from "./capabilities/temperature-battery-status.mjs";
import WakeUpTrigger from "./capabilities/wake-up-trigger.mjs";
import ControlCharging from "./flows/control-charging.mjs";
import ControlClimatisation from "./flows/control-climatisation.mjs";
import type Flow from "./flows/flow.mjs";
import UpdateChargingSettings from "./flows/update-charge-settings.mjs";

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

	private readonly capabilities: Capability[] = [
		new Access(this),
		new BatteryStatus(this),
		new TemperatureBatteryStatus(this),
		new ChargingSettings(this),
		new ChargingStatus(this),
		new ClimatisationStatus(this),
		new Coordinate(this),
		new DistanceHome(this),
		new HonkAndFlash(this),
		new MaintenanceStatus(this),
		new OdometerStatus(this),
		new PlugStatus(this),
		new ReadinessStatus(this),
		new WakeUpTrigger(this),
	];

	private readonly flows: Flow[] = [
		new UpdateChargingSettings(this),
		new ControlCharging(this),
		new ControlClimatisation(this),
	];

	public async onInit(): Promise<void> {
		const vehicle = await this.getVehicle();
		vehicle.onSettingsUpdate(this.setSettings.bind(this));

		const vehicleData = await this.fetchVehicleData(vehicle);

		await this.setEnergy({
			electricCar:
				vehicleData.capabilities.fuelStatus?.rangeStatus?.value.carType ===
				"electric",
		});

		for (const capability of this.capabilities) {
			await capability.addCapabilities(vehicleData);
		}

		for (const capability of this.capabilities) {
			await capability.registerCapabilityListeners(vehicleData);
		}

		for (const flow of this.flows) {
			await flow.register();
		}

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
	}

	public async onUninit(): Promise<void> {
		await this.onDeleted();
	}

	public async onDeleted(): Promise<void> {
		this.debounceScheduler.destroy();

		for (const flow of this.flows) {
			await flow.unregister();
		}
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
	): Promise<VehicleData> {
		if (!vehicle) {
			vehicle = await this.getVehicle();
		}

		const capabilities = await vehicle.getVehicleCapabilities();
		const parkingPosition = await vehicle
			.getParkingPosition()
			.catch(() => null);

		return { capabilities, parkingPosition };
	}

	private async setCapabilities(
		vehicleData: VehicleData | null = null,
	): Promise<void> {
		if (!vehicleData) {
			vehicleData = await this.fetchVehicleData();
		}

		await Promise.all(
			this.capabilities.map((capability) =>
				capability.setCapabilityValues(vehicleData),
			),
		);
	}
}
