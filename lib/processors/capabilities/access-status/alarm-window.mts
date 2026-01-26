import BaseDevice from "../../../api/drivers/base-device.mjs";
import { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class AlarmWindowCapability extends Capability<boolean> {
  constructor(
    baseDevice: BaseDevice,
    private readonly subCapabilityName: string
  ) {
    super(baseDevice);
  }

  protected getCapabilityName(): string {
    return `alarm_window.${this.subCapabilityName}`;
  }

  public override async getter({ capabilities }: FetchData): Promise<boolean> {
    const window = capabilities.access?.accessStatus?.value?.windows.find(
      (window) => window.name === this.subCapabilityName
    );

    if (!window || window.status.includes("unsupported")) {
      throw new InvalidValueError(window);
    }

    return !window.status.includes("closed");
  }
}
