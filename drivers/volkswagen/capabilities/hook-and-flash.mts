import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.mjs";
import Capability from "./capability.mjs";

export default class HonkAndFlash extends Capability {
	protected override getCapabilityName(): string {
		return "hook_and_flash";
	}

	public override async addCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const canHonkAndFlash = await this.can(
			"honkAndFlash",
			capabilities.userCapabilities?.capabilitiesStatus.value,
		);

		if (!canHonkAndFlash) {
			return;
		}

		if (!this.volkswagenDevice.hasCapability("button_flash")) {
			await this.volkswagenDevice.addCapability("button_flash");
		}

		if (!this.volkswagenDevice.hasCapability("button_honk_flash")) {
			await this.volkswagenDevice.addCapability("button_honk_flash");
		}
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
}
