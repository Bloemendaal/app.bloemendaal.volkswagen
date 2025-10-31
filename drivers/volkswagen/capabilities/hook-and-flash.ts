import type { CapabilitiesStatusData } from "../api/capabilities/user-capabilities.js";
import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.js";
import Capability from "./capability.js";

export default class HonkAndFlash extends Capability {
	protected override getCapabilityName(): string {
		return "hook_and_flash";
	}

	public override async addCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const canHonkAndFlash = await this.canHonkAndFlash(
			capabilities.userCapabilities?.capabilitiesStatus.value,
		);

		if (!canHonkAndFlash) {
			return;
		}

		const promises: Promise<void>[] = [];

		if (!this.volkswagenDevice.hasCapability("button_flash")) {
			promises.push(this.volkswagenDevice.addCapability("button_flash"));
		}

		if (!this.volkswagenDevice.hasCapability("button_honk_flash")) {
			promises.push(this.volkswagenDevice.addCapability("button_honk_flash"));
		}

		await Promise.all(promises);
	}

	public override async registerCapabilityListeners(): Promise<void> {
		if (this.volkswagenDevice.hasCapability("button_flash")) {
			this.volkswagenDevice.registerCapabilityListener(
				"button_flash",
				async () => {
					const vehicle = await this.volkswagenDevice.getVehicle();
					const position = await vehicle.getParkingPosition();

					await vehicle.honkAndFlash({
						mode: "flash",
						duration: 10,
						userPosition: {
							latitude: position.lat,
							longitude: position.lon,
						},
					});
				},
			);
		}

		if (this.volkswagenDevice.hasCapability("button_honk_flash")) {
			this.volkswagenDevice.registerCapabilityListener(
				"button_honk_flash",
				async () => {
					const vehicle = await this.volkswagenDevice.getVehicle();
					const position = await vehicle.getParkingPosition();

					await vehicle.honkAndFlash({
						mode: "honk-and-flash",
						duration: 10,
						userPosition: {
							latitude: position.lat,
							longitude: position.lon,
						},
					});
				},
			);
		}
	}

	private async canHonkAndFlash(
		capabilities: CapabilitiesStatusData[] = [],
	): Promise<boolean> {
		const callback = ({ id }: CapabilitiesStatusData) => id === "honkAndFlash";

		if (capabilities.some(callback)) {
			return true;
		}

		const vehicle = await this.volkswagenDevice.getVehicle();

		return vehicle.capabilities.some(callback);
	}
}
