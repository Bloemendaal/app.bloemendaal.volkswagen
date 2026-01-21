import type { FetchData } from "../../api/fetch.mjs";
import Setting from "./setting.mjs";

export default class EnergySetting extends Setting {
	public async register({ capabilities }: FetchData): Promise<void> {
		await this.device.setEnergy({
			electricCar:
				capabilities.fuelStatus?.rangeStatus?.value?.carType === "electric",
		});
	}
}
