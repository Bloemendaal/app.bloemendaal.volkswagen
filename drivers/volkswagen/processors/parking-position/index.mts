import type { FetchData } from "../../api/fetch.mjs";
import type { DateTimeString } from "../../types.mjs";
import CapabilityGroup from "../capability-group.mjs";
import type { Processable } from "../processable.mjs";
import CoordinateLatitudeCapability from "./coordinate-latitude.mjs";
import CoordinateLongitudeCapability from "./coordinate-longitude.mjs";
import MeasureDistanceHomeCapability from "./measure-distance-home.mjs";

export default class ParkingPositionCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "parking_position";
	}

	protected getCapabilityTimestamp({
		parkingPosition,
	}: FetchData): DateTimeString | null {
		return parkingPosition?.carCapturedTimestamp ?? null;
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
			new CoordinateLatitudeCapability(this.volkswagenDevice),
			new CoordinateLongitudeCapability(this.volkswagenDevice),
			new MeasureDistanceHomeCapability(this.volkswagenDevice),
		];
	}
}
