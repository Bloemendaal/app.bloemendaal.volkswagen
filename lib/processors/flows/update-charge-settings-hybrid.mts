import type { ChargingSettings } from "../../api/vehicles/base-vehicle.mjs";
import Flow from "./flow.mjs";

interface UpdateChargingSettingsHybridArgs {
  reduced_charging: "yes" | "no";
}

export default class UpdateChargingSettingsHybridFlow extends Flow {
  public override async register(): Promise<void> {
    const card = this.baseDevice.homey.flow.getActionCard(
      "update_charge_settings_hybrid",
    );

    card.registerRunListener(this.handleAction.bind(this));
  }

  private async handleAction(
    args: UpdateChargingSettingsHybridArgs,
  ): Promise<void> {
    const vehicle = await this.baseDevice
      .getVehicle()
      .catch((e: Error) => this.baseDevice.errorAndThrow(e));

    const settings: Partial<ChargingSettings> = {
      chargingSettingsAC: {
        maxChargeCurrentAC:
          args.reduced_charging === "yes" ? "reduced" : "maximum",
      },
    };

    // Get current capabilities to detect if vehicle is hybrid
    const capabilities = await vehicle.getVehicleCapabilities();

    await vehicle
      .updateChargingSettings(settings, capabilities)
      .catch((e) => this.baseDevice.errorAndThrow(e));

    await this.baseDevice.requestRefresh(500, 1000);
  }
}
