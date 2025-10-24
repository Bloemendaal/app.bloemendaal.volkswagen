import Authenticatable, { type Configuration } from "./authenticatable.js";
import {
	type SelectiveStatusCapabilitiesData,
	selectiveStatusCapabilities,
} from "./capabilities.js";

export interface VehicleData {
	vin: string;
	role: string;
	userRoleStatus: string;
	enrollmentStatus: string;
	brandCode: string;
	model: string;
	nickname: string;
	capabilities: VehicleCapabilityData[];
	images: VehicleImagesData;
	coUsers: CoUserData[];
	devicePlatform: string;
	tags: TagData[];
}

export interface VehicleCapabilityData {
	id: string;
	status?: number[];
	expirationDate?: string;
	userDisablingAllowed: boolean;
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
	public readonly capabilities: VehicleCapabilityData[];
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

	public async getVehicleStatus(): Promise<
		Partial<SelectiveStatusCapabilitiesData>
	> {
		const client = await this.getClient();

		const capabilities = selectiveStatusCapabilities
			.filter((capability) =>
				this.capabilities.some((c) => c.id === capability),
			)
			.join(",");

		const response = await client.get<Partial<SelectiveStatusCapabilitiesData>>(
			`/vehicle/v1/vehicles/${this.vin}/selectivestatus?jobs=${capabilities}`,
		);

		return response.data;
	}
}
