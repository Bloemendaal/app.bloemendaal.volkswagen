import type VagDevice from "#lib/api/drivers/vag-device.mjs";
import type { FetchData } from "#lib/api/fetch.mjs";
import type { Processable } from "#lib/processors/processable.mjs";

export default abstract class Setting implements Processable {
	constructor(protected readonly device: VagDevice) {}

	public abstract register(fetchData: FetchData): Promise<void>;

	public async run(): Promise<void> {
		// Settings are set once and do not need to be updated regularly
	}
}
