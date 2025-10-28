import Authenticatable, { type Configuration } from "./authenticatable.js";
import type { CapabilitiesStatusData } from "./capabilities/user-capabilities.js";
import {
	type SelectiveStatusCapabilitiesData,
	selectiveStatusCapabilities,
} from "./capabilities.js";
import type {
	ClimatisationSettings,
	StartClimatisationSettings,
} from "./climatisation.js";
import type { ParkingPositionData } from "./parking-position.js";

export interface VehicleData {
	vin: string;
	role: string;
	userRoleStatus: string;
	enrollmentStatus: string;
	brandCode: string;
	model: string;
	nickname: string;
	capabilities: CapabilitiesStatusData[];
	images: VehicleImagesData;
	coUsers: CoUserData[];
	devicePlatform: string;
	tags: TagData[];
}

// Not sure yet what's inside these types
export type VehicleImagesData = object;
export type CoUserData = unknown;
export type TagData = unknown;

export default class Vehicle extends Authenticatable implements VehicleData {
	public readonly vin: string;
	public readonly role: string;
	public readonly userRoleStatus: string;
	public readonly enrollmentStatus: string;
	public readonly brandCode: string;
	public readonly model: string;
	public readonly nickname: string;
	public readonly capabilities: CapabilitiesStatusData[];
	public readonly images: VehicleImagesData;
	public readonly coUsers: CoUserData[];
	public readonly devicePlatform: string;
	public readonly tags: TagData[];

	constructor(data: VehicleData, configuration: Configuration) {
		super(configuration);

		this.vin = data.vin;
		this.role = data.role;
		this.userRoleStatus = data.userRoleStatus;
		this.enrollmentStatus = data.enrollmentStatus;
		this.brandCode = data.brandCode;
		this.model = data.model;
		this.nickname = data.nickname;
		this.capabilities = data.capabilities;
		this.images = data.images;
		this.coUsers = data.coUsers;
		this.devicePlatform = data.devicePlatform;
		this.tags = data.tags;
	}

	public async getVehicleCapabilities(): Promise<
		Partial<SelectiveStatusCapabilitiesData>
	> {
		const client = await this.getClient();

		const response = await client.get<Partial<SelectiveStatusCapabilitiesData>>(
			`/vehicle/v1/vehicles/${this.vin}/selectivestatus?jobs=${selectiveStatusCapabilities.join(",")}`,
		);

		return response.data;
	}

	public async getParkingPosition(): Promise<ParkingPositionData> {
		const client = await this.getClient();

		const response = await client.get<{ data: ParkingPositionData }>(
			`/vehicle/v1/vehicles/${this.vin}/parkingposition`,
		);

		return response.data.data;
	}

	public async lock(): Promise<void> {
		if (!this.configuration.sPin) {
			throw new Error("S-PIN is required to lock the vehicle");
		}

		const client = await this.getClient();

		await client.post(`/vehicle/v1/vehicles/${this.vin}/doors/lock`, {
			spin: this.configuration.sPin,
		});
	}

	public async unlock(): Promise<void> {
		if (!this.configuration.sPin) {
			throw new Error("S-PIN is required to unlock the vehicle");
		}

		const client = await this.getClient();

		await client.post(`/vehicle/v1/vehicles/${this.vin}/doors/unlock`, {
			spin: this.configuration.sPin,
		});
	}

	public lockOrUnlock(lock: boolean): Promise<void> {
		return lock ? this.lock() : this.unlock();
	}

	public async startClimatisation(
		settings: StartClimatisationSettings = {},
	): Promise<void> {
		if (typeof settings.targetTemperature === "number") {
			settings.targetTemperature =
				Math.round(settings.targetTemperature / 0.5) * 0.5;
		}

		const client = await this.getClient();

		await client.post(
			`/vehicle/v1/vehicles/${this.vin}/climatisation/start`,
			settings,
		);
	}

	public async updateClimatisation(
		settings: ClimatisationSettings = {},
	): Promise<void> {
		if (typeof settings.targetTemperature === "number") {
			settings.targetTemperature =
				Math.round(settings.targetTemperature / 0.5) * 0.5;
		}

		const client = await this.getClient();

		await client.put(
			`/vehicle/v1/vehicles/${this.vin}/climatisation/settings`,
			settings,
		);
	}

	public async stopClimatisation(): Promise<void> {
		const client = await this.getClient();

		await client.post(`/vehicle/v1/vehicles/${this.vin}/climatisation/stop`);
	}

	public async wake(): Promise<void> {
		const client = await this.getClient();

		await client.post(`/vehicle/v1/vehicles/${this.vin}/vehiclewakeuptrigger`);
	}

	public async honkAndFlash(options: {
		mode: "flash" | "honk-and-flash";
		duration: number;
		userPosition: {
			latitude: number;
			longitude: number;
		};
	}): Promise<void> {
		const client = await this.getClient();

		await client.post(`/vehicle/v1/vehicles/${this.vin}/honkandflash`, {
			mode: options.mode,
			duration_s: options.duration,
			userPosition: options.userPosition,
		});
	}

	public async startCharging(): Promise<void> {
		const client = await this.getClient();

		await client.post(`/vehicle/v1/vehicles/${this.vin}/charging/start`);
	}

	public async stopCharging(): Promise<void> {
		const client = await this.getClient();

		await client.post(`/vehicle/v1/vehicles/${this.vin}/charging/stop`);
	}

	public async updateChargingSettings(settings: {
		maxChargeCurrentAC?: number | "reduced" | "maximum";
		autoUnlockPlugWhenChargedAC?: boolean;
		targetSOC_pct?: number;
	}): Promise<void> {
		const client = await this.getClient();

		const payload: Record<string, unknown> = {};

		if (typeof settings.maxChargeCurrentAC === "number") {
			const maxChargeCurrentAC = settings.maxChargeCurrentAC;

			const [amperage] = [5, 10, 13, 32].sort(
				(a, b) =>
					Math.abs(a - maxChargeCurrentAC) - Math.abs(b - maxChargeCurrentAC),
			);

			payload.maxChargeCurrentAC_A = amperage;
		} else if (typeof settings.maxChargeCurrentAC === "string") {
			payload.maxChargeCurrentAC = settings.maxChargeCurrentAC;
		}

		if (settings.autoUnlockPlugWhenChargedAC !== undefined) {
			payload.autoUnlockPlugWhenChargedAC = settings.autoUnlockPlugWhenChargedAC
				? "on"
				: "off";
		}

		if (settings.targetSOC_pct !== undefined) {
			payload.targetSOC_pct = Math.round(settings.targetSOC_pct);
		}

		await client.put(
			`/vehicle/v1/vehicles/${this.vin}/charging/settings`,
			payload,
		);
	}

	public async startWindowHeating(): Promise<void> {
		const client = await this.getClient();

		await client.post(`/vehicle/v1/vehicles/${this.vin}/windowheating/start`);
	}

	public async stopWindowHeating(): Promise<void> {
		const client = await this.getClient();

		await client.post(`/vehicle/v1/vehicles/${this.vin}/windowheating/stop`);
	}
}
