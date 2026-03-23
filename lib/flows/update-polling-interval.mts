import type VagDevice from "#lib/drivers/vag-device.mjs";
import Flow from "./flow.mjs";

interface UpdatePollingIntervalArgs {
	interval: number;
	device: VagDevice;
}

export default class UpdatePollingIntervalFlow extends Flow {
	public override async register(): Promise<void> {
		const card = this.app.homey.flow.getActionCard("update_polling_interval");

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(args: UpdatePollingIntervalArgs): Promise<void> {
		if (!args.interval || args.interval < 1) {
			throw new Error(this.__("flows.polling_interval.invalid"));
		}

		await args.device.setSettings({
			pollingInterval: +args.interval,
		});
	}
}
