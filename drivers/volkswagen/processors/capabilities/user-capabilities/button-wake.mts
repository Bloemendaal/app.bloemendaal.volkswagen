import type { FetchData } from "../../../api/fetch.mjs";
import Capability from "../capability.mjs";

export default class ButtonWakeCapability extends Capability<never> {
	protected getCapabilityName(): string {
		return "button_wake";
	}

	public override async guard({ capabilities }: FetchData): Promise<boolean> {
		return await this.can(
			"vehicleWakeUpTrigger",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);
	}

	public override async setter(fetchData: FetchData): Promise<void> {
		const canWakeUp = await this.guard(fetchData);

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
