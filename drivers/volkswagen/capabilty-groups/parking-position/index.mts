import type { DateTimeString } from "../../api/types.mjs";
import type { VehicleData } from "../../device.mjs";
import CapabilityGroup, { type AnyCapability } from "../capability-group.mjs";
import CoordinateLatitudeCapability from "./coordinate-latitude.mjs";
import CoordinateLongitudeCapability from "./coordinate-longitude.mjs";
import MeasureDistanceHomeCapability from "./measure-distance-home.mjs";

export default class ParkingPositionCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "parking_position";
	}

	protected getCapabilityTimestamp({
		parkingPosition,
	}: VehicleData): DateTimeString | undefined {
		return parkingPosition?.carCapturedTimestamp;
	}

	protected async getCapabilities(
		_vehicleData: VehicleData,
	): Promise<AnyCapability[]> {
		return [
			new CoordinateLatitudeCapability(this.volkswagenDevice),
			new CoordinateLongitudeCapability(this.volkswagenDevice),
			new MeasureDistanceHomeCapability(this.volkswagenDevice),
		];
	}
}
