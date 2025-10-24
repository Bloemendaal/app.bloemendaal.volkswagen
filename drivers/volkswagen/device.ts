import Homey from "homey";
import User from "./api/user.js";
import type Vehicle from "./api/vehicle.js";

export default class VolkswagenDevice extends Homey.Device {
	private vehicle: Vehicle | null = null;

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
		} catch {
			this.error("An error occurred while fetching the vehicle");
			throw new Error("Unable to get vehicle");
		}
	}

	/**
	 * onInit is called when the device is initialized.
	 */
	public async onInit(): Promise<void> {
		const vehicle = await this.getVehicle();
		const status = await vehicle.getVehicleStatus();

		this.setCapabilityValue(
			"measure_battery",
			status.charging?.batteryStatus.value.currentSOC_pct ?? null,
		);
	}

	/**
	 * onAdded is called when the user adds the device, called just after pairing.
	 */
	public async onAdded(): Promise<void> {
		this.log("MyDevice has been added");
	}

	/**
	 * onSettings is called when the user updates the device's settings.
	 * @param {object} event the onSettings event data
	 * @param {object} event.oldSettings The old settings object
	 * @param {object} event.newSettings The new settings object
	 * @param {string[]} event.changedKeys An array of keys changed since the previous version
	 * @returns {Promise<string|void>} return a custom message that will be displayed
	 */
	public async onSettings({
		oldSettings,
		newSettings,
		changedKeys,
	}: {
		oldSettings: {
			[key: string]: boolean | string | number | undefined | null;
		};
		newSettings: {
			[key: string]: boolean | string | number | undefined | null;
		};
		changedKeys: string[];
	}): Promise<string | void> {
		this.log("MyDevice settings where changed");
	}

	/**
	 * onDeleted is called when the user deleted the device.
	 */
	public async onDeleted(): Promise<void> {
		this.log("MyDevice has been deleted");
	}
}
