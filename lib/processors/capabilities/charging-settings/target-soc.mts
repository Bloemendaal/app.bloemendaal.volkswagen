import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class TargetSocCapability extends Capability<number> {
  protected getCapabilityName(): string {
    return "target_soc";
  }

  public override async getter({ capabilities }: FetchData): Promise<number> {
    const targetSoC =
      capabilities.charging?.chargingSettings?.value?.targetSOC_pct;

    if (!this.isNumber(targetSoC)) {
      throw new InvalidValueError(targetSoC);
    }

    return targetSoC;
  }

  public override async setter(_fetchData: FetchData): Promise<void> {
    this.baseDevice.registerCapabilityListener(
      this.getCapabilityName(),
      async (value: number) => {
        const vehicle = await this.baseDevice.getVehicle();

        await vehicle.updateChargingSettings({
          targetSOC_pct: Math.round(value),
        });
      },
    );
  }
}
