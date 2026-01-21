import type { FetchData } from "../../../api/fetch.mjs";
import Capability from "../capability.mjs";

export default class ButtonFlashCapability extends Capability<never> {
	protected getCapabilityName(): string {
		return "button_flash";
	}

	public override async guard({ capabilities }: FetchData): Promise<boolean> {
		return await this.can(
			"honkAndFlash",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);
	}

	public override async setter(fetchData: FetchData): Promise<void> {
		const canHonkAndFlash = await this.guard(fetchData);

		if (!canHonkAndFlash) {
			return;
		}

		this.device.registerCapabilityListener(
			this.getCapabilityName(),
			async () => {
				const vehicle = await this.device.getVehicle();
				const position = await vehicle.getParkingPosition();

				await vehicle.honkAndFlash({
					mode: "flash",
					duration: 10,
					userPosition: {
						latitude:
							"lat" in position
								? position.lat
								: this.device.homey.geolocation.getLatitude(),
						longitude:
							"lon" in position
								? position.lon
								: this.device.homey.geolocation.getLongitude(),
					},
				});
			},
		);
	}
}
