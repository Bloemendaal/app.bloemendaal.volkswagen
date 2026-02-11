import type { FetchData } from "#lib/api/fetch.mjs";
import CapabilityGroup from "#lib/processors/capabilities/capability-group.mjs";
import type { Processable } from "#lib/processors/processable.mjs";
import type { DateTimeString } from "#lib/types.mjs";
import MaintenanceDueDaysCapability from "./maintenance-due-days.mjs";
import MaintenanceDueKmCapability from "./maintenance-due-km.mjs";
import OilServiceDueDaysCapability from "./oil-service-due-days.mjs";
import OilServiceDueKmCapability from "./oil-service-due-km.mjs";

export default class MaintenanceStatusCapabilityGroup extends CapabilityGroup {
  protected getCapabilityGroupName(): string {
    return "maintenance_status";
  }

  protected getCapabilityTimestamp({
    capabilities,
  }: FetchData): DateTimeString | null {
    return (
      capabilities.vehicleHealthInspection?.maintenanceStatus?.value
        ?.carCapturedTimestamp ?? null
    );
  }

  protected async getProcessables(
    _fetchData: FetchData,
  ): Promise<Processable[]> {
    return [
      new MaintenanceDueDaysCapability(this.baseDevice),
      new MaintenanceDueKmCapability(this.baseDevice),
      new OilServiceDueDaysCapability(this.baseDevice),
      new OilServiceDueKmCapability(this.baseDevice),
    ];
  }
}
