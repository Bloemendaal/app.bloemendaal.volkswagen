import { FetchData } from "../../../api/fetch.mjs";
import type { DateTimeString } from "../../../types.mjs";
import type { Processable } from "../../processable.mjs";
import CapabilityGroup from "../capability-group.mjs";
import VehicleActiveCapability from "./vehicle-active.mjs";
import VehicleOnlineCapability from "./vehicle-online.mjs";

export default class ReadinessStatusCapabilityGroup extends CapabilityGroup {
  protected getCapabilityGroupName(): string {
    return "readiness_status";
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
      new VehicleOnlineCapability(this.baseDevice),
      new VehicleActiveCapability(this.baseDevice),
    ];
  }
}
