import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class ButtonWakeRefreshCapability extends Capability<undefined> {
	protected getCapabilityName(): string {
		return "button_wake_refresh";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<undefined> => {
		const canWakeUp = await this.can(
			"vehicleWakeUpTrigger",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);

		if (!canWakeUp) {
			throw new InvalidValueError("vehicleWakeUpTrigger not supported");
		}

		return undefined;
	};

	public override setter = async (): Promise<void> => {
		const vehicle = await this.volkswagenDevice.getVehicle();
		await vehicle.wake();
		await this.volkswagenDevice.requestRefresh();
	};
}
