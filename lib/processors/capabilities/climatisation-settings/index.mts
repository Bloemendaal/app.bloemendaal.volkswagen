import type { FetchData } from "../../../api/fetch.mjs";
import type { DateTimeString } from "../../../types.mjs";
import type { Processable } from "../../processable.mjs";
import CapabilityGroup from "../capability-group.mjs";
import WindowHeatingEnabledCapability from "./window-heating-enabled.mjs";

export default class ClimatisationSettingsCapabilityGroup extends CapabilityGroup {
  protected getCapabilityGroupName(): string {
    return "climatisation_settings";
  }

  protected getCapabilityTimestamp({
    capabilities,
  }: FetchData): DateTimeString | null {
    return (
      capabilities.climatisation?.climatisationSettings?.value
        ?.carCapturedTimestamp ?? null
    );
  }

  protected async getProcessables(): Promise<Processable[]> {
    return [new WindowHeatingEnabledCapability(this.baseDevice)];
  }
}
