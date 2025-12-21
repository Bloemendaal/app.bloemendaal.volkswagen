import type { FetchData } from "../../api/fetch.mjs";
import Capability from "../capability.mjs";

export default class ButtonFlashCapability extends Capability<never> {
	protected getCapabilityName(): string {
		return "button_flash";
	}

	public override async setter({ capabilities }: FetchData): Promise<void> {
		const canHonkAndFlash = await this.can(
			"honkAndFlash",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);

		if (!canHonkAndFlash) {
			return;
		}

		this.volkswagenDevice.registerCapabilityListener(
			this.getCapabilityName(),
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
}
