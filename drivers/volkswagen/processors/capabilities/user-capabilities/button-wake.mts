import type { FetchData } from "../../../api/fetch.mjs";
import Capability from "../capability.mjs";

export default class ButtonWakeCapability extends Capability<never> {
	protected getCapabilityName(): string {
		return "button_wake";
	}

	public override async setter({ capabilities }: FetchData): Promise<void> {
		const canWakeUp = await this.can(
			"vehicleWakeUpTrigger",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);

		if (!canWakeUp) {
			return;
		}

		this.volkswagenDevice.registerCapabilityListener(
			this.getCapabilityName(),
			async () => {
				const vehicle = await this.volkswagenDevice.getVehicle();
				await vehicle.wake();
			},
		);
	}
}
