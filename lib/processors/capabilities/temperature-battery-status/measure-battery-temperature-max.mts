import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";
import type { FloatString } from "#lib/types.mjs";

export default class MeasureBatteryTemperatureMaxCapability extends Capability<number> {
  protected getCapabilityName(): string {
    return "measure_battery_temperature.max";
  }

  public override async getter({ capabilities }: FetchData): Promise<number> {
    const batteryTempMax =
      capabilities.measurements?.temperatureBatteryStatus?.value
        ?.temperatureHvBatteryMax_K;

    if (!this.isFloatString(batteryTempMax)) {
      throw new InvalidValueError(batteryTempMax);
    }

    return this.kelvinToCelsius(batteryTempMax);
  }

  public override async setter(_fetchData: FetchData): Promise<void> {
    this.baseDevice.setCapabilityOptions(this.getCapabilityName(), {
      title: this.baseDevice.homey.__(
        "capabilities.measure_battery_temperature.title",
        {
          name: this.baseDevice.homey.__(
            "capabilities.measure_battery_temperature.variables.max",
          ),
        },
      ),
    });
  }

  private kelvinToCelsius(kelvin: FloatString): number {
    return Number.parseFloat(kelvin) - 273.15;
  }
}
