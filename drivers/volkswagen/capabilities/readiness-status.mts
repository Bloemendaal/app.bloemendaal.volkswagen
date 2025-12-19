import Capability, { type VehicleData } from "./capability.mjs";

export default class ReadinessStatus extends Capability {
	protected override getCapabilityName(): string {
		return "readiness_status";
	}

	public override async addCapabilities({
		capabilities,
	}: VehicleData): Promise<void> {
		const isOnline =
			capabilities.readiness?.readinessStatus?.value?.connectionState.isOnline;

		if (
			typeof isOnline === "boolean" &&
			!this.volkswagenDevice.hasCapability("vehicle_online")
		) {
			await this.volkswagenDevice.addCapability("vehicle_online");
		}

		const isActive =
			capabilities.readiness?.readinessStatus?.value?.connectionState.isActive;

		if (
			typeof isActive === "boolean" &&
			!this.volkswagenDevice.hasCapability("vehicle_active")
		) {
			await this.volkswagenDevice.addCapability("vehicle_active");
		}
	}

	public override async setCapabilityValues({
		capabilities,
	}: VehicleData): Promise<void> {
		const isOnline =
			capabilities.readiness?.readinessStatus?.value?.connectionState.isOnline;

		if (
			typeof isOnline === "boolean" &&
			this.volkswagenDevice.hasCapability("vehicle_online")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"vehicle_online",
				isOnline,
			);
		}

		const isActive =
			capabilities.readiness?.readinessStatus?.value?.connectionState.isActive;

		if (
			typeof isActive === "boolean" &&
			this.volkswagenDevice.hasCapability("vehicle_active")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"vehicle_active",
				isActive,
			);
		}
	}
}
