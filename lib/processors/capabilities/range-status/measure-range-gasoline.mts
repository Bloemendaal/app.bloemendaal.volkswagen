import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class MeasureRangeGasolineCapability extends Capability<number> {
  protected getCapabilityName(): string {
    return "measure_range.gasoline";
  }

  public override async getter({ capabilities }: FetchData): Promise<number> {
    const gasolineRange =
      capabilities.measurements?.rangeStatus?.value?.gasolineRange;

    if (!this.isNumber(gasolineRange)) {
      throw new InvalidValueError(gasolineRange);
    }

    return gasolineRange;
  }

  public override async setter(_fetchData: FetchData): Promise<void> {
    this.baseDevice.setCapabilityOptions(this.getCapabilityName(), {
      title: this.baseDevice.homey.__("capabilities.measure_range.title", {
        name: this.baseDevice.homey.__(
          "capabilities.measure_range.variables.gasoline",
        ),
      }),
    });
  }
}
