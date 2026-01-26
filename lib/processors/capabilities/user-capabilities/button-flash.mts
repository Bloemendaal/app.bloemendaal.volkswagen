import { FetchData } from "../../../api/fetch.mjs";
import Capability from "../capability.mjs";

export default class ButtonFlashCapability extends Capability<never> {
  protected getCapabilityName(): string {
    return "button_flash";
  }

  public override async guard({ capabilities }: FetchData): Promise<boolean> {
    return await this.can(
      "honkAndFlash",
      capabilities.userCapabilities?.capabilitiesStatus?.value
    );
  }

  public override async setter(fetchData: FetchData): Promise<void> {
    const canHonkAndFlash = await this.guard(fetchData);

    if (!canHonkAndFlash) {
      return;
    }

    this.baseDevice.registerCapabilityListener(
      this.getCapabilityName(),
      async () => {
        const vehicle = await this.baseDevice.getVehicle();
        const position = await vehicle.getParkingPosition();

        console.log("Honk and flash requested");
        console.log("Vehicle for honk and flash:", vehicle);
        console.log("Vehicle position for honk and flash:", position);

        await vehicle.honkAndFlash({
          mode: "flash",
          duration: 10,
          userPosition: {
            latitude: position.lat,
            longitude: position.lon,
          },
        });
      }
    );
  }
}
