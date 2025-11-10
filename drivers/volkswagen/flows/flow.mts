import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.mjs";
import type VolkswagenDevice from "../device.mjs";

export default abstract class Flow {
	constructor(protected readonly device: VolkswagenDevice) {}

	public abstract register(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void>;

	public async unregister(): Promise<void> {
		// Optional to implement
	}

	protected __(key: string | object, tags?: object): string {
		return this.device.homey.__(key, tags);
	}
}
