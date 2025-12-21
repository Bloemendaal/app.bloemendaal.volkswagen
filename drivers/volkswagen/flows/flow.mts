import type VolkswagenDevice from "../device.mjs";

export default abstract class Flow {
	constructor(protected readonly device: VolkswagenDevice) {}

	public abstract register(): Promise<void>;

	protected __(key: string | object, tags?: object): string {
		return this.device.homey.__(key, tags);
	}
}
