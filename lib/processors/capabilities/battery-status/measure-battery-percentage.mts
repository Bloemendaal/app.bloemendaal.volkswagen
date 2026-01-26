import { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureBatteryPercentageCapability extends Capability<number> {
  protected getCapabilityName(): string {
    return "measure_battery_percentage";
  }

  public override async getter({ capabilities }: FetchData): Promise<number> {
    const currentSoC =
      capabilities.charging?.batteryStatus?.value?.currentSOC_pct;

    if (!this.isNumber(currentSoC)) {
      throw new InvalidValueError(currentSoC);
    }

    return currentSoC;
  }
}
