import type VolkswagenDevice from "../device.mjs";

export default abstract class Flow {
	constructor(protected readonly device: VolkswagenDevice) {}

	public abstract register(): Promise<void>;

	public async unregister(): Promise<void> {
		// Optional to implement
	}

	protected __(key: string | object, tags?: object): string {
		return this.device.homey.__(key, tags);
	}
}
