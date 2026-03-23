import Homey from "homey";
import type { FetchData } from "#lib/api/fetch.mjs";
import type VagDevice from "#lib/drivers/vag-device.mjs";
import ControlChargingFlow from "#lib/flows/control-charging.mjs";
import ControlClimatisationFlow from "#lib/flows/control-climatisation.mjs";
import type Flow from "#lib/flows/flow.mjs";
import TimestampUpdatedFlow from "#lib/flows/timestamp-updated.mjs";
import UpdateChargingSettingsFlow from "#lib/flows/update-charge-settings.mjs";
import UpdatePollingIntervalFlow from "#lib/flows/update-polling-interval.mjs";

export default class VagApp extends Homey.App {
	public readonly flows: Flow[] = [
		new ControlChargingFlow(this),
		new ControlClimatisationFlow(this),
		new TimestampUpdatedFlow(this),
		new UpdatePollingIntervalFlow(this),
		new UpdateChargingSettingsFlow(this),
	];

	public async onInit(): Promise<void> {
		for (const flow of this.flows) {
			await flow.register().catch(this.error.bind(this));
		}
	}

	public async runFlowsForDevice(
		device: VagDevice,
		fetchData: FetchData,
	): Promise<void> {
		const errors: unknown[] = [];

		for (const flow of this.flows) {
			try {
				await flow.run(device, fetchData);
			} catch (e) {
				errors.push(e);
			}
		}

		if (errors.length) {
			throw new AggregateError(errors, "One or more flows failed to update");
		}
	}
}
