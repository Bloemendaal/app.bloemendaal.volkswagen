import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class MeasureRangeElectricCapability extends Capability<number> {
  protected getCapabilityName(): string {
    return "measure_range.electric";
  }

  public override async getter({ capabilities }: FetchData): Promise<number> {
    const electricRange =
      capabilities.measurements?.rangeStatus?.value?.electricRange;

    if (!this.isNumber(electricRange)) {
      throw new InvalidValueError(electricRange);
    }

    return electricRange;
  }

  public override async setter(_fetchData: FetchData): Promise<void> {
    this.baseDevice.setCapabilityOptions(this.getCapabilityName(), {
      title: this.baseDevice.homey.__("capabilities.measure_range.title", {
        name: this.baseDevice.homey.__(
          "capabilities.measure_range.variables.electric",
        ),
      }),
    });
  }
}
