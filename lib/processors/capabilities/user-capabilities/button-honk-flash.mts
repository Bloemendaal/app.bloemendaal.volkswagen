import type { FetchData } from "../../../api/fetch.mjs";
import Capability from "../capability.mjs";

export default class ButtonHonkFlashCapability extends Capability<never> {
	protected getCapabilityName(): string {
		return "button_honk_flash";
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

		this.vagDevice.registerCapabilityListener(
			this.getCapabilityName(),
			async () => {
				const vehicle = await this.vagDevice.getVehicle();
				const position = await vehicle.getParkingPosition();

				await vehicle.honkAndFlash({
					mode: "honk-and-flash",
					duration: 10,
					userPosition: {
						latitude:
							"lat" in position
								? position.lat
								: this.volkswagenDevice.homey.geolocation.getLatitude(),
						longitude:
							"lon" in position
								? position.lon
								: this.volkswagenDevice.homey.geolocation.getLongitude(),
					},
				});
			},
		);
	}
}
