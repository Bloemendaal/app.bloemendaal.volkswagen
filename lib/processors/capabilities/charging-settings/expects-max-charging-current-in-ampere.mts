import { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class ExpectsMaxChargingCurrentInAmpereCapability extends Capability<boolean> {
  protected getCapabilityName(): string {
    return "expects_max_charging_current_in_ampere";
  }

  public override async getter({ capabilities }: FetchData): Promise<boolean> {
    const chargingSettings = capabilities.charging?.chargingSettings?.value;

    if (!chargingSettings) {
      throw new InvalidValueError(chargingSettings);
    }

    return this.isNumber(chargingSettings.maxChargeCurrentAC_A);
  }
}
