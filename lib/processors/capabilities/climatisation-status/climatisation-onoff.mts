import type { StartClimatisationSettings } from "../../../api/climatisation.mjs";
import { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class ClimatisationOnOffCapability extends Capability<boolean> {
  protected getCapabilityName(): string {
    return "climatisation_onoff";
  }

  public override async getter({ capabilities }: FetchData): Promise<boolean> {
    const climatisationState =
      capabilities.climatisation?.climatisationStatus?.value
        ?.climatisationState;

    if (!climatisationState || climatisationState === "unsupported") {
      throw new InvalidValueError(climatisationState);
    }

    return climatisationState !== "off";
  }

  public override async setter({ capabilities }: FetchData): Promise<void> {
    const name = this.getCapabilityName();
    const isSetable = await this.can(
      "climatisation",
      capabilities.userCapabilities?.capabilitiesStatus?.value
    );

    this.baseDevice.setCapabilityOptions(
      name,
      isSetable
        ? { setable: true, uiComponent: "toggle" }
        : { setable: false, uiComponent: "sensor" }
    );

    if (!isSetable) {
      return;
    }

    this.baseDevice.registerCapabilityListener(name, async (value: boolean) => {
      const vehicle = await this.baseDevice.getVehicle();

      if (value) {
        const currentTargetTemp =
          this.baseDevice.getCapabilityValue("target_temperature");

        const settings: StartClimatisationSettings = {
          targetTemperatureUnit: "celsius",
        };

        if (typeof currentTargetTemp === "number") {
          settings.targetTemperature = currentTargetTemp;
        }

        await vehicle.startClimatisation(settings);
      } else {
        await vehicle.stopClimatisation();
      }

      await this.baseDevice.requestRefresh();
    });
  }
}
