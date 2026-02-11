import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class CoordinateLongitudeCapability extends Capability<number> {
  protected getCapabilityName(): string {
    return "coordinate.longitude";
  }

  public override async getter({
    parkingPosition,
  }: FetchData): Promise<number> {
    if (!parkingPosition?.parked) {
      throw new InvalidValueError(parkingPosition);
    }

    return parkingPosition.lon;
  }

  public override async setter(_fetchData: FetchData): Promise<void> {
    this.baseDevice.setCapabilityOptions(this.getCapabilityName(), {
      title: this.baseDevice.homey.__("capabilities.coordinate.title", {
        name: this.baseDevice.homey.__(
          "capabilities.coordinate.variables.longitude",
        ),
      }),
    });
  }
}
