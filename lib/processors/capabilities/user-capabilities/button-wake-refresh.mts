import type { FetchData } from "#lib/api/fetch.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class ButtonWakeRefreshCapability extends Capability<never> {
	protected getCapabilityName(): string {
		return "button_wake_refresh";
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

		this.baseDevice.registerCapabilityListener(
			this.getCapabilityName(),
			async () => {
				const vehicle = await this.baseDevice.getVehicle();
				await vehicle.wake();
				await this.baseDevice.requestRefresh();
			},
		);
	}
}
