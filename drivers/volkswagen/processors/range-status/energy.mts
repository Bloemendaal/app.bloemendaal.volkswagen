import type { FetchData } from "../../api/fetch.mjs";
import type VolkswagenDevice from "../../device.mjs";
import type { Processable } from "../processable.mjs";

export default class EnergySetting implements Processable {
	constructor(private readonly volkswagenDevice: VolkswagenDevice) {}

	public async register({ capabilities }: FetchData): Promise<void> {
		await this.volkswagenDevice.setEnergy({
			electricCar:
				capabilities.fuelStatus?.rangeStatus?.value?.carType === "electric",
		});
	}

	public async run(): Promise<void> {}
}
