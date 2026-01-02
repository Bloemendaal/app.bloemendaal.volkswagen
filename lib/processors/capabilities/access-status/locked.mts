import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class LockedCapability extends Capability<boolean> {
	protected getCapabilityName(): string {
		return "locked";
	}

	public override async getter({ capabilities }: FetchData): Promise<boolean> {
		const lockedStatus =
			capabilities.access?.accessStatus?.value?.doorLockStatus;

		if (lockedStatus !== "locked" && lockedStatus !== "unlocked") {
			throw new InvalidValueError(lockedStatus);
		}

		return lockedStatus === "locked";
	}

	public override async setter({ capabilities }: FetchData): Promise<void> {
		const name = this.getCapabilityName();

		const isSetable = await this.can(
			"access",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);

		await this.vagDevice.setCapabilityOptions(
			name,
			isSetable
				? { setable: true, uiComponent: "toggle" }
				: { setable: false, uiComponent: "sensor" },
		);

		if (!isSetable) {
			return;
		}

		this.vagDevice.registerCapabilityListener(name, async (value: boolean) => {
			const vehicle = await this.vagDevice.getVehicle();
			await vehicle.lockOrUnlock(value);
		});
	}
}
