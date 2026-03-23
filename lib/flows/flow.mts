import type VagApp from "app.mjs";
import type { FetchData } from "#lib/api/fetch.mjs";
import type VagDevice from "#lib/drivers/vag-device.mjs";

export default abstract class Flow {
	constructor(protected readonly app: VagApp) {}

	public abstract register(): Promise<void>;

	public async run(_device: VagDevice, _fetchData: FetchData): Promise<void> {}

	protected __(key: string | object, tags?: object): string {
		return this.app.homey.__(key, tags);
	}
}
