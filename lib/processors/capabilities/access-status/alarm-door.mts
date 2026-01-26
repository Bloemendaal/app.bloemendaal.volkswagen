import BaseDevice from "../../../api/drivers/base-device.mjs";
import { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class AlarmDoorCapability extends Capability<boolean> {
  constructor(
    baseDevice: BaseDevice,
    private readonly subCapabilityName: string
  ) {
    super(baseDevice);
  }

  protected getCapabilityName(): string {
    return `alarm_door.${this.subCapabilityName}`;
  }

  public override async getter({ capabilities }: FetchData): Promise<boolean> {
    const door = capabilities.access?.accessStatus?.value?.doors.find(
      (door) => door.name === this.subCapabilityName
    );

    if (!door || door.status.includes("unsupported")) {
      throw new InvalidValueError(door);
    }

    return door.status.includes("unlocked");
  }
}
