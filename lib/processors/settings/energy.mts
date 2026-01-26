import type { FetchData } from "../../api/fetch.mjs";
import Setting from "./setting.mjs";

export default class EnergySetting extends Setting {
  public async register({ capabilities }: FetchData): Promise<void> {
    await this.baseDevice.setEnergy({
      electricCar:
        capabilities.fuelStatus?.rangeStatus?.value?.carType === "electric",
    });
  }
}
