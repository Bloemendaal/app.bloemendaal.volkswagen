import { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class AlarmGeneralCapability extends Capability<boolean> {
  protected getCapabilityName(): string {
    return "alarm_general";
  }

  public override async getter({ capabilities }: FetchData): Promise<boolean> {
    const overallStatus =
      capabilities.access?.accessStatus?.value?.overallStatus;

    if (overallStatus !== "safe" && overallStatus !== "unsafe") {
      throw new InvalidValueError(overallStatus);
    }

    return overallStatus !== "safe";
  }
}
