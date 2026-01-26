import type {
  ChargingSettings,
  ChargingSettingsAC,
} from "../../api/vehicles/base-vehicle.mjs";
import Flow from "./flow.mjs";

interface UpdateChargingSettingsArgs {
  max_charge_current:
    | "5"
    | "10"
    | "13"
    | "32"
    | "reduced"
    | "maximum"
    | "unchanged";
  target_soc?: number;
  auto_unlock: "true" | "false" | "unchanged";
}

export default class UpdateChargingSettingsFlow extends Flow {
  public override async register(): Promise<void> {
    const card = this.baseDevice.homey.flow.getActionCard(
      "update_charge_settings",
    );

    card.registerRunListener(this.handleAction.bind(this));
    card.registerArgumentAutocompleteListener(
      "max_charge_current",
      this.getMaxChargeCurrentOptions.bind(this),
    );
  }

  private async getMaxChargeCurrentOptions(): Promise<
    { name: string; id: string }[]
  > {
    const expectsMaxCurrentInAmpere = this.baseDevice.hasCapability(
      "expects_max_charging_current_in_ampere",
    )
      ? this.baseDevice.getCapabilityValue(
          "expects_max_charging_current_in_ampere",
        )
      : false;

    if (expectsMaxCurrentInAmpere) {
      // Show numeric ampere values
      return [
        { name: "5A", id: "5" },
        { name: "10A", id: "10" },
        { name: "13A", id: "13" },
        { name: "32A", id: "32" },
        { name: this.__("flows.unchanged"), id: "unchanged" },
      ];
    }

    // Show reduced/maximum options
    return [
      { name: this.__("flows.charge_current.reduced"), id: "reduced" },
      { name: this.__("flows.charge_current.maximum"), id: "maximum" },
      { name: this.__("flows.unchanged"), id: "unchanged" },
    ];
  }

  private async handleAction(args: UpdateChargingSettingsArgs): Promise<void> {
    const vehicle = await this.baseDevice
      .getVehicle()
      .catch((e: Error) => this.baseDevice.errorAndThrow(e));

    const settings: Partial<ChargingSettings> = {};

    // Only include targetSOC_pct if explicitly set
    if (args.target_soc !== undefined && args.target_soc !== null) {
      settings.targetSOC_pct = args.target_soc;
    }

    const chargingSettingsAC = this.resolveChargingSettingsAC(args);
    if (chargingSettingsAC) {
      settings.chargingSettingsAC = chargingSettingsAC;
    }

    if (Object.keys(settings).length === 0) {
      return;
    }

    // Get current capabilities to detect if vehicle is hybrid
    const capabilities = await vehicle.getVehicleCapabilities();

    await vehicle
      .updateChargingSettings(settings, capabilities)
      .catch((e) => this.baseDevice.errorAndThrow(e));

    await this.baseDevice.requestRefresh(500, 1000);
  }

  private resolveChargingSettingsAC(
    settings: UpdateChargingSettingsArgs,
  ): ChargingSettingsAC | undefined {
    if (
      settings.auto_unlock === "unchanged" &&
      settings.max_charge_current === "unchanged"
    ) {
      return;
    }

    const maxCurrent = this.resolveChargeCurrent(settings);
    const autoUnlock = this.resolveAutoUnlock(settings);

    // Only include settings that are defined
    const chargingSettingsAC: Partial<ChargingSettingsAC> = {};

    if (maxCurrent !== undefined) {
      chargingSettingsAC.maxChargeCurrentAC = maxCurrent;
    }

    if (autoUnlock !== undefined) {
      chargingSettingsAC.autoUnlockPlugWhenChargedAC = autoUnlock;
    }

    // If no settings were resolved, return undefined
    if (Object.keys(chargingSettingsAC).length === 0) {
      return undefined;
    }

    return chargingSettingsAC as ChargingSettingsAC;
  }

  private resolveChargeCurrent({
    max_charge_current,
  }: UpdateChargingSettingsArgs): ChargingSettingsAC["maxChargeCurrentAC"] {
    if (
      max_charge_current === "unchanged" &&
      this.baseDevice.hasCapability("max_charging_current")
    ) {
    }

    if (max_charge_current === "maximum" || max_charge_current === "reduced") {
      return max_charge_current;
    }

    return Number.parseInt(max_charge_current, 10);
  }

  private resolveAutoUnlock({
    auto_unlock,
  }: UpdateChargingSettingsArgs): boolean | undefined {
    if (auto_unlock === "unchanged") {
      return this.baseDevice.hasCapability("auto_unlock_plug_when_charged")
        ? this.baseDevice.getCapabilityValue("auto_unlock_plug_when_charged")
        : false;
    }

    return auto_unlock === "true";
  }
}
