import type { ParkingPositionData } from "../api/parking-position.mjs";
import Capability, { type VehicleData } from "./capability.mjs";

const EARTH_RADIUS_M = 6371000;

export default class DistanceHome extends Capability {
	protected override getCapabilityName(): string {
		return "distance_home";
	}

	public override async addCapabilities({
		parkingPosition,
	}: VehicleData): Promise<void> {
		if (!parkingPosition) {
			return;
		}

		if (!this.volkswagenDevice.hasCapability("measure_distance_home")) {
			await this.volkswagenDevice.addCapability("measure_distance_home");
		}

		await this.addTimestampCapability();
	}

	public override async setCapabilityValues({
		parkingPosition,
	}: VehicleData): Promise<void> {
		if (!this.volkswagenDevice.hasCapability("measure_distance_home")) {
			return;
		}

		if (!parkingPosition) {
			return;
		}

		await this.checkTimestamp(parkingPosition.carCapturedTimestamp);

		const distance = this.calculateDistanceFromHome(parkingPosition);

		if (distance !== null) {
			await this.volkswagenDevice.setCapabilityValue(
				"measure_distance_home",
				distance,
			);
		}
	}

	private calculateDistanceFromHome(
		parkingPosition: ParkingPositionData,
	): number | null {
		const homey = this.volkswagenDevice.homey;

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
