import { FetchData } from "../../../api/fetch.mjs";
import type { DateTimeString } from "../../../types.mjs";
import type { Processable } from "../../processable.mjs";
import CapabilityGroup from "../capability-group.mjs";
import ButtonFlashCapability from "./button-flash.mjs";
import ButtonHonkFlashCapability from "./button-honk-flash.mjs";
import ButtonWakeCapability from "./button-wake.mjs";
import ButtonWakeRefreshCapability from "./button-wake-refresh.mjs";

export default class UserCapabilitiesCapabilityGroup extends CapabilityGroup {
  protected getCapabilityGroupName(): string {
    return "user_capabilities";
  }

  protected getCapabilityTimestamp(
    _fetchData: FetchData
  ): DateTimeString | null {
    return null;
  }

  protected async getProcessables(
    _fetchData: FetchData
  ): Promise<Processable[]> {
    return [
      new ButtonFlashCapability(this.baseDevice),
      new ButtonHonkFlashCapability(this.baseDevice),
      new ButtonWakeCapability(this.baseDevice),
      new ButtonWakeRefreshCapability(this.baseDevice),
    ];
  }
}
