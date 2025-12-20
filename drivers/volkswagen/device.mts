import Homey from "homey";
import type { SelectiveStatusCapabilitiesData } from "./api/capabilities.mjs";
import DebounceScheduler from "./api/debounce-scheduler.mjs";
import type { ParkingPositionData } from "./api/parking-position.mjs";
import User from "./api/user.mjs";
import type Vehicle from "./api/vehicle.mjs";
import TranslatableError from "./errors/translatable-error.mjs";
import ControlCharging from "./flows/control-charging.mjs";
import ControlClimatisation from "./flows/control-climatisation.mjs";
import type Flow from "./flows/flow.mjs";
import UpdateChargingSettings from "./flows/update-charge-settings.mjs";
import type CapabilityGroup from "./capabilty-groups/capability-group.mjs";
import AccessStatusCapabilityGroup from "./capabilty-groups/access-status/index.mjs";
import BatteryStatusCapabilityGroup from "./capabilty-groups/battery-status/index.mjs";
import ChargingSettingsCapabilityGroup from "./capabilty-groups/charging-settings/index.mjs";
import ChargingStatusCapabilityGroup from "./capabilty-groups/charging-status/index.mjs";
import ClimatisationStatusCapabilityGroup from "./capabilty-groups/climatisation-status/index.mjs";
import MaintenanceStatusCapabilityGroup from "./capabilty-groups/maintenance-status/index.mjs";
import OdometerStatusCapabilityGroup from "./capabilty-groups/odometer-status/index.mjs";
import ParkingPositionCapabilityGroup from "./capabilty-groups/parking-position/index.mjs";
import PlugStatusCapabilityGroup from "./capabilty-groups/plug-status/index.mjs";
import ReadinessStatusCapabilityGroup from "./capabilty-groups/readiness-status/index.mjs";
import TemperatureBatteryStatusCapabilityGroup from "./capabilty-groups/temperature-battery-status/index.mjs";
import UserCapabilitiesCapabilityGroup from "./capabilty-groups/user-capabilities/index.mjs";

const MS_TO_MINUTES = 60 * 1000;
const DEFAULT_POLLING_INTERVAL_MINUTES = 10;

interface OnSettingsParams {
	oldSettings: { [key: string]: boolean | string | number | undefined | null };
	newSettings: { [key: string]: boolean | string | number | undefined | null };
	changedKeys: string[];
}

export interface VehicleData {
	capabilities: Partial<SelectiveStatusCapabilitiesData>;
	parkingPosition: ParkingPositionData | null;
}

export default class VolkswagenDevice extends Homey.Device {
	private vehicle: Vehicle | null = null;

	private readonly debounceScheduler: DebounceScheduler<void> =
		new DebounceScheduler<void>(this.setCapabilities.bind(this));

	private readonly capabilityGroups: CapabilityGroup[] = [
		new AccessStatusCapabilityGroup(this),
		new BatteryStatusCapabilityGroup(this),
		new ChargingSettingsCapabilityGroup(this),
		new ChargingStatusCapabilityGroup(this),
		new ClimatisationStatusCapabilityGroup(this),
		new MaintenanceStatusCapabilityGroup(this),
		new OdometerStatusCapabilityGroup(this),
		new ParkingPositionCapabilityGroup(this),
		new PlugStatusCapabilityGroup(this),
		new ReadinessStatusCapabilityGroup(this),
		new TemperatureBatteryStatusCapabilityGroup(this),
		new UserCapabilitiesCapabilityGroup(this),
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
				vehicleData.capabilities.fuelStatus?.rangeStatus?.value?.carType ===
				"electric",
		});

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

		for (const capabilityGroup of this.capabilityGroups) {
			await capabilityGroup.run(vehicleData);
		}
	}
}
