import type { FetchData } from "#lib/api/fetch.mjs";
import type { ParkedPosition } from "#lib/api/parking-position.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

const EARTH_RADIUS_M = 6371000;

export default class MeasureDistanceHomeCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_distance_home";
	}

	public override async getter({
		parkingPosition,
	}: FetchData): Promise<number> {
		if (!parkingPosition?.parked) {
			throw new InvalidValueError(parkingPosition);
		}

		const distance = this.calculateDistanceFromHome(parkingPosition);

		if (distance === null) {
			throw new InvalidValueError(distance);
		}

		return distance;
	}

	private calculateDistanceFromHome(
		parkingPosition: ParkedPosition,
	): number | null {
		const homey = this.baseDevice.homey;

		const homeLat = homey.geolocation.getLatitude();
		const homeLon = homey.geolocation.getLongitude();

		if (!this.isNumber(homeLat) || !this.isNumber(homeLon)) {
			return null;
		}

		const carLat = parkingPosition.lat;
		const carLon = parkingPosition.lon;

		if (!this.isNumber(carLat) || !this.isNumber(carLon)) {
			return null;
		}

		return this.haversineDistance(homeLat, homeLon, carLat, carLon);
	}

	private haversineDistance(
		lat1: number,
		lon1: number,
		lat2: number,
		lon2: number,
	): number {
		const toRadians = (degrees: number) => degrees * (Math.PI / 180);

		const dLat = toRadians(lat2 - lat1);
		const dLon = toRadians(lon2 - lon1);

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRadians(lat1)) *
				Math.cos(toRadians(lat2)) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return Math.round(EARTH_RADIUS_M * c);
	}
}
