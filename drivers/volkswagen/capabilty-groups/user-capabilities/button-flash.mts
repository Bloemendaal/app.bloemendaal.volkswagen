import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class ButtonFlashCapability extends Capability<undefined> {
	protected getCapabilityName(): string {
		return "button_flash";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<undefined> => {
		const canHonkAndFlash = await this.can(
			"honkAndFlash",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);

		if (!canHonkAndFlash) {
			throw new InvalidValueError("honkAndFlash not supported");
		}

		return undefined;
	};

	public override setter = async (): Promise<void> => {
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
	};
}
