import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.js";
import Capability from "./capability.js";

export default class WakeUpTrigger extends Capability {
	protected override getCapabilityName(): string {
		return "wake_up_trigger";
	}

	public override async addCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const canWakeUp = await this.can(
			"vehicleWakeUpTrigger",
			capabilities.userCapabilities?.capabilitiesStatus.value,
		);

		if (!canWakeUp) {
			return;
		}

		const promises: Promise<void>[] = [];

		if (!this.volkswagenDevice.hasCapability("button_wake")) {
			promises.push(this.volkswagenDevice.addCapability("button_wake"));
		}

		if (!this.volkswagenDevice.hasCapability("button_wake_refresh")) {
			promises.push(this.volkswagenDevice.addCapability("button_wake_refresh"));
		}

		await Promise.all(promises);
	}

	public override async registerCapabilityListeners(): Promise<void> {
		if (this.volkswagenDevice.hasCapability("button_wake")) {
			this.volkswagenDevice.registerCapabilityListener(
				"button_wake",
				async () => {
					const vehicle = await this.volkswagenDevice.getVehicle();
					await vehicle.wake();
				},
			);
		}

		if (this.volkswagenDevice.hasCapability("button_wake_refresh")) {
			this.volkswagenDevice.registerCapabilityListener(
				"button_wake_refresh",
				async () => {
					const vehicle = await this.volkswagenDevice.getVehicle();
					await vehicle.wake();
					await this.volkswagenDevice.setCapabilities();
				},
			);
		}
	}
}
