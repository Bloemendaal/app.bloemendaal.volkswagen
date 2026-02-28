import type { Authenticatable } from "../authenticatable.mjs";
import type { CapabilitiesStatusData } from "../capabilities/user-capabilities.mjs";
import {
	type SelectiveStatusCapabilitiesData,
	selectiveStatusCapabilities,
} from "../capabilities.mjs";

// Re-export commonly used types and constants
export { selectiveStatusCapabilities };
export type { SelectiveStatusCapabilitiesData };

import type {
	ClimatisationSettings,
	StartClimatisationSettings,
} from "../climatisation.mjs";
import type { ParkingPositionData } from "../parking-position.mjs";

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

export interface ChargingSettingsAC {
	maxChargeCurrentAC: number | "reduced" | "maximum";
	autoUnlockPlugWhenChargedAC?: boolean | undefined;
}

export interface ChargingSettings {
	targetSOC_pct?: number;
	chargingSettingsAC?: ChargingSettingsAC;
}

export default abstract class VagVehicle implements VehicleData {
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

	constructor(
		data: VehicleData,
		public readonly authenticator: Authenticatable,
	) {
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

	public abstract getVehicleCapabilities(): Promise<
		Partial<SelectiveStatusCapabilitiesData>
	>;

	public abstract getParkingPosition(): Promise<ParkingPositionData>;

	public abstract lock(): Promise<void>;

	public abstract unlock(): Promise<void>;

	public lockOrUnlock(lock: boolean): Promise<void> {
		return lock ? this.lock() : this.unlock();
	}

	public abstract startClimatisation(
		settings?: StartClimatisationSettings,
	): Promise<void>;

	public abstract updateClimatisation(
		settings?: ClimatisationSettings,
	): Promise<void>;

	public abstract stopClimatisation(): Promise<void>;

	public abstract wake(): Promise<void>;

	public abstract honkAndFlash(options: {
		mode: "flash" | "honk-and-flash";
		duration: number;
		userPosition: {
			latitude: number;
			longitude: number;
		};
	}): Promise<void>;

	public abstract startCharging(): Promise<void>;

	public abstract stopCharging(): Promise<void>;

	public abstract updateChargingSettings(
		settings: ChargingSettings,
	): Promise<void>;

	public abstract startWindowHeating(): Promise<void>;

	public abstract stopWindowHeating(): Promise<void>;
}
