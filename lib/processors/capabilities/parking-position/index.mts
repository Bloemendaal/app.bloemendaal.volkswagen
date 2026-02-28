import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import CoordinateLatitudeCapability from "./coordinate-latitude.mjs";
import CoordinateLongitudeCapability from "./coordinate-longitude.mjs";
import IsParkedCapability from "./is-parked.mjs";
import MeasureDistanceHomeCapability from "./measure-distance-home.mjs";

export default class ParkingPositionCapabilityGroup extends CapabilityGroup {
	protected getCapabilityGroupName(): string {
		return "parking_position";
	}

	protected getCapabilityTimestamp({
		parkingPosition,
	}: FetchData): DateTimeString | null {
		if (!parkingPosition?.parked) {
			return null;
		}

		return parkingPosition?.carCapturedTimestamp ?? null;
	}

	protected async getProcessables(
		_fetchData: FetchData,
	): Promise<Processable[]> {
		return [
			new CoordinateLatitudeCapability(this.device),
			new CoordinateLongitudeCapability(this.device),
			new IsParkedCapability(this.device),
			new MeasureDistanceHomeCapability(this.device),
		];
	}
}
