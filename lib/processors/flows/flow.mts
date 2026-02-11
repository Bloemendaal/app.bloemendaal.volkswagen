import BaseDevice from "#lib/api/drivers/base-device.mjs";
import type { FetchData } from "#lib/api/fetch.mjs";
import type { Processable, RunOptions } from "#lib/processors/processable.mjs";

export default abstract class Flow implements Processable {
  constructor(protected readonly baseDevice: BaseDevice) {}

  public abstract register(fetchData: FetchData): Promise<void>;

  public async run(
    _fetchData: FetchData,
    _options?: RunOptions,
  ): Promise<void> {}

  protected __(key: string | object, tags?: object): string {
    return this.baseDevice.homey.__(key, tags);
  }
}
