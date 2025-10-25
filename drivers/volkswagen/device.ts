import Homey from "homey";
import User from "./api/user.js";
import type Vehicle from "./api/vehicle.js";

const DEFAULT_POLLING_INTERVAL_MINUTES = 10;

interface OnSettingsParams {
	oldSettings: { [key: string]: boolean | string | number | undefined | null };
	newSettings: { [key: string]: boolean | string | number | undefined | null };
	changedKeys: string[];
}

export default class VolkswagenDevice extends Homey.Device {
	private vehicle: Vehicle | null = null;
	private intervalHandle: NodeJS.Timeout | null = null;

	public async onInit(): Promise<void> {
		const vehicle = await this.getVehicle();
		vehicle.onSettingsUpdate(this.setSettings.bind(this));

		this.registerCapabilityListener("locked", async (value: boolean) => {
			const vehicle = await this.getVehicle();

			value ? await vehicle.lock() : await vehicle.unlock();
		});

		await this.setCapabilities();

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
			await this.setCapabilities();
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

	private async getVehicle(): Promise<Vehicle> {
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

	private startInterval(intervalInMinutes: number): void {
		if (this.intervalHandle) {
			clearInterval(this.intervalHandle);
		}

		this.intervalHandle = setInterval(
			this.setCapabilities.bind(this),
			intervalInMinutes * 60 * 1000,
		);
	}

	private async setCapabilities(): Promise<void> {
		const vehicle = await this.getVehicle();
		const status = await vehicle.getVehicleStatus();

		this.setCapabilityValue(
			"measure_battery",
			status.charging?.batteryStatus.value.currentSOC_pct ?? null,
		);

		this.setCapabilityValue(
			"ev_charging_state",
			{
				off: "plugged_out",
				readyForCharging: "plugged_in",
				notReadyForCharging: "plugged_out",
				conservation: null,
				chargePurposeReachedAndNotConservationCharging: null,
				chargePurposeReachedAndConservation: null,
				charging: "plugged_in_charging",
				error: "plugged_in_paused",
				unsupported: null,
				discharging: "plugged_in_discharging",
			}[status.charging?.chargingStatus.value.chargingState ?? "unsupported"],
		);

		this.setCapabilityValue(
			"locked",
			status.access?.accessStatus.value.doorLockStatus
				? status.access.accessStatus.value.doorLockStatus === "locked"
				: null,
		);
	}
}
