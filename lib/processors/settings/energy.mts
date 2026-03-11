import type { FetchData } from "#lib/api/fetch.mjs";
import Setting from "./setting.mjs";

export default class EnergySetting extends Setting {
	public async register(fetchData: FetchData | null): Promise<void> {
		if (!fetchData) {
			return;
		}

		await this.device.setEnergy({
			electricCar:
				fetchData.capabilities.fuelStatus?.rangeStatus?.value?.carType ===
				"electric",
		});
	}
}
