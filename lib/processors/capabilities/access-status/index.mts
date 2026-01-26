import { FetchData } from "../../../api/fetch.mjs";
import CapabilityGroup from "../capability-group.mjs";
import AlarmDoorCapability from "./alarm-door.mjs";
import AlarmGeneralCapability from "./alarm-general.mjs";
import AlarmWindowCapability from "./alarm-window.mjs";
import LockedCapability from "./locked.mjs";
import { DateTimeString } from "../../../types.mjs";
import { Processable } from "../../processable.mjs";

export default class AccessStatusCapabilityGroup extends CapabilityGroup {
  protected getCapabilityGroupName(): string {
    return "access_status";
  }

  protected getCapabilityTimestamp({
    capabilities,
  }: FetchData): DateTimeString | null {
    return (
      capabilities.access?.accessStatus?.value?.carCapturedTimestamp ?? null
    );
  }

  protected async getProcessables({
    capabilities,
  }: FetchData): Promise<Processable[]> {
    const capabilitiesList: Processable[] = [
      new LockedCapability(this.baseDevice),
      new AlarmGeneralCapability(this.baseDevice),
    ];

    const doors = capabilities.access?.accessStatus?.value?.doors ?? [];

    for (const door of doors) {
      capabilitiesList.push(
        new AlarmDoorCapability(this.baseDevice, door.name)
      );
    }

    const windows = capabilities.access?.accessStatus?.value?.windows ?? [];

    for (const window of windows) {
      capabilitiesList.push(
        new AlarmWindowCapability(this.baseDevice, window.name)
      );
    }

    return capabilitiesList;
  }
}
