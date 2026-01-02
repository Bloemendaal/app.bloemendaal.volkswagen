import type { FetchData } from "../../api/fetch.mjs";
import type VagDevice from "../../drivers/vag-device.mjs";
import type { Processable } from "../processable.mjs";

export default abstract class Setting implements Processable {
	constructor(protected readonly vagDevice: VagDevice) {}

	public abstract register(fetchData: FetchData): Promise<void>;

	public async run(): Promise<void> {
		// Settings are set once and do not need to be updated regularly
	}
}
