import { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureChargingPowerCapability extends Capability<number> {
  protected getCapabilityName(): string {
    return "measure_charging_power";
  }

  public override async getter({ capabilities }: FetchData): Promise<number> {
    const chargePower =
      capabilities.charging?.chargingStatus?.value?.chargePower_kW;

    if (!this.isNumber(chargePower)) {
      throw new InvalidValueError(chargePower);
    }

    return chargePower;
  }
}
