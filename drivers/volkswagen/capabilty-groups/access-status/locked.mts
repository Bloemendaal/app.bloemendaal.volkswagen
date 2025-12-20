import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability, { type CapabilityOptions } from "../capability.mjs";

export default class LockedCapability extends Capability<boolean> {
	protected getCapabilityName(): string {
		return "locked";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<boolean> => {
		const lockedStatus =
			capabilities.access?.accessStatus?.value?.doorLockStatus;

		if (lockedStatus !== "locked" && lockedStatus !== "unlocked") {
			throw new InvalidValueError(lockedStatus);
		}

		return lockedStatus === "locked";
	};

	public override setter = async (value: boolean): Promise<void> => {
		const vehicle = await this.volkswagenDevice.getVehicle();
		await vehicle.lockOrUnlock(value);
	};

	public override getOptions = async ({
		capabilities,
	}: VehicleData): Promise<Partial<CapabilityOptions>> => {
		const isSetable = await this.can(
			"access",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);

		return isSetable
			? { setable: true, uiComponent: "toggle" }
			: { setable: false, uiComponent: "sensor" };
	};
}
