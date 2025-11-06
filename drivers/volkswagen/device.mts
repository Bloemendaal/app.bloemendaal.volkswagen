import Homey from "homey";
import type { SelectiveStatusCapabilitiesData } from "./api/capabilities.mjs";
import User from "./api/user.mjs";
import type Vehicle from "./api/vehicle.mjs";
import Access from "./capabilities/access.mjs";
import BatteryStatus from "./capabilities/battery-status.mjs";
import type Capability from "./capabilities/capability.mjs";
import ChargingSettings from "./capabilities/charging-settings.mjs";
import ChargingStatus from "./capabilities/charging-status.mjs";
import HonkAndFlash from "./capabilities/hook-and-flash.mjs";
import MaintenanceStatus from "./capabilities/maintenance-status.mjs";
import OdometerStatus from "./capabilities/odometer-status.mjs";
import ReadinessStatus from "./capabilities/readiness-status.mjs";
import TemperatureBatteryStatus from "./capabilities/temperature-battery-status.mjs";
import WakeUpTrigger from "./capabilities/wake-up-trigger.mjs";

const DEFAULT_POLLING_INTERVAL_MINUTES = 10;

interface OnSettingsParams {
	oldSettings: { [key: string]: boolean | string | number | undefined | null };
	newSettings: { [key: string]: boolean | string | number | undefined | null };
	changedKeys: string[];
}

export default class VolkswagenDevice extends Homey.Device {
	private vehicle: Vehicle | null = null;
	private intervalHandle: NodeJS.Timeout | null = null;

	private readonly capabilities: Capability[] = [
		new Access(this),
		new BatteryStatus(this),
		new TemperatureBatteryStatus(this),
		new ChargingSettings(this),
		new ChargingStatus(this),
		new HonkAndFlash(this),
		new MaintenanceStatus(this),
		new OdometerStatus(this),
		new ReadinessStatus(this),
		new WakeUpTrigger(this),
	];

	public async onInit(): Promise<void> {
		const vehicle = await this.getVehicle();
		vehicle.onSettingsUpdate(this.setSettings.bind(this));

		const capabilities = await vehicle.getVehicleCapabilities();

		await this.setEnergy({
			electricCar:
				capabilities.fuelStatus?.rangeStatus.value.carType === "electric",
		});

		for (const capability of this.capabilities) {
			await capability.addCapabilities(capabilities);
		}

		for (const capability of this.capabilities) {
			await capability.registerCapabilityListeners(capabilities);
		}

		await this.setCapabilities(capabilities).catch(
			this.ignoreTimeoutError.bind(this),
		);

		this.startInterval(
			this.getSettings().pollingInterval || DEFAULT_POLLING_INTERVAL_MINUTES,
		);
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
			await this.setCapabilities().catch(this.ignoreTimeoutError.bind(this));
		}

		if (changedKeys.includes("pollingInterval")) {
			const interval = +(
				newSettings.pollingInterval || DEFAULT_POLLING_INTERVAL_MINUTES
			);

			this.startInterval(interval);
		}
	}

	public async onDeleted(): Promise<void> {
		if (this.intervalHandle) {
			clearInterval(this.intervalHandle);
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
			this.error("An error occurred while fetching the vehicle");
			throw error;
		}
	}

	public async setCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData> | null = null,
	): Promise<void> {
		if (!capabilities) {
			const vehicle = await this.getVehicle();
			capabilities = await vehicle.getVehicleCapabilities();
		}

		await Promise.all(
			this.capabilities.map((capability) =>
				capability.setCapabilityValues(capabilities),
			),
		);
	}

	private startInterval(intervalInMinutes: number): void {
		if (this.intervalHandle) {
			clearInterval(this.intervalHandle);
		}

		this.intervalHandle = setInterval(
			() => this.setCapabilities().catch(this.ignoreTimeoutError.bind(this)),
			intervalInMinutes * 60 * 1000,
		);
	}

	private ignoreTimeoutError(error: unknown): void {
		if (error instanceof Error) {
			return;
		}

		throw error;
	}
}
