import { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureBatteryUntilFullCapability extends Capability<number> {
  protected getCapabilityName(): string {
    return "measure_battery.until_full";
  }

  public override async getter({ capabilities }: FetchData): Promise<number> {
    const currentSoC =
      capabilities.charging?.batteryStatus?.value?.currentSOC_pct;

    if (!this.isNumber(currentSoC)) {
      throw new InvalidValueError(currentSoC);
    }

    return Math.max(0, 100 - currentSoC);
  }

  public override async setter(_fetchData: FetchData): Promise<void> {
    this.baseDevice.setCapabilityOptions(this.getCapabilityName(), {
      uiComponent: "sensor",
      title: this.baseDevice.homey.__("capabilities.measure_battery.title", {
        name: this.baseDevice.homey.__(
          "capabilities.measure_battery.variables.until_full"
        ),
      }),
    });
  }
}
