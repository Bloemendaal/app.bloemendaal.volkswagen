import type { Authenticatable } from "../authenticatable.mjs";
import BaseVehicle, {
	selectiveStatusCapabilities,
	type VehicleData,
} from "./base-vehicle.mjs";

/**
 * Vehicle class for Volkswagen and Skoda
 * Uses the standard VAG API endpoints (/vehicle/v1/*)
 */
export default class VolkswagenVehicle extends BaseVehicle {
	constructor(data: VehicleData, authenticator: Authenticatable) {
		super(data, authenticator);
	}

	protected getSelectiveStatusUrl(): string {
		return `/vehicle/v1/vehicles/${
			this.vin
		}/selectivestatus?jobs=${selectiveStatusCapabilities.join(",")}`;
	}

	protected getParkingPositionUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/parkingposition`;
	}

	protected getLockUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/access/lock`;
	}

	protected getUnlockUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/access/unlock`;
	}

	protected getStartClimatisationUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/climatisation/start`;
	}

	protected getUpdateClimatisationUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/climatisation/settings`;
	}

	protected getStopClimatisationUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/climatisation/stop`;
	}

	protected getWakeUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/vehiclewakeuptrigger`;
	}

	protected getHonkAndFlashUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/honkandflash`;
	}

	protected getStartChargingUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/charging/start`;
	}

	protected getStopChargingUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/charging/stop`;
	}

	protected getUpdateChargingSettingsUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/charging/settings`;
	}

	protected getStartWindowHeatingUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/windowheating/start`;
	}

	protected getStopWindowHeatingUrl(): string {
		return `/vehicle/v1/vehicles/${this.vin}/windowheating/stop`;
	}

	protected async performLock(client: any, sPin: string): Promise<void> {
		await client.post(this.getLockUrl(), {
			spin: sPin,
		});
	}

	protected async performUnlock(client: any, sPin: string): Promise<void> {
		await client.post(this.getUnlockUrl(), {
			spin: sPin,
		});
	}
}
