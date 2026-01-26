import { FetchData } from "../../../api/fetch.mjs";
import type { DateTimeString } from "../../../types.mjs";
import type { Processable } from "../../processable.mjs";
import CapabilityGroup from "../capability-group.mjs";
import ClimatisationOnOffCapability from "./climatisation-onoff.mjs";
import MeasureRemainingClimatisationTimeCapability from "./measure-remaining-climatisation-time.mjs";
import TargetTemperatureCapability from "./target-temperature.mjs";

export default class ClimatisationStatusCapabilityGroup extends CapabilityGroup {
  protected getCapabilityGroupName(): string {
    return "climatisation_status";
  }

  protected getCapabilityTimestamp({
    capabilities,
  }: FetchData): DateTimeString | null {
    return (
      capabilities.climatisation?.climatisationStatus?.value
        ?.carCapturedTimestamp ?? null
    );
  }

  protected async getProcessables(
    _fetchData: FetchData
  ): Promise<Processable[]> {
    return [
      new ClimatisationOnOffCapability(this.baseDevice),
      new TargetTemperatureCapability(this.baseDevice),
      new MeasureRemainingClimatisationTimeCapability(this.baseDevice),
    ];
  }
}
