import type { FetchData } from "../../api/fetch.mjs";
import Flow from "./flow.mjs";

interface UpdatePollingIntervalArgs {
	interval: number;
}

export default class UpdatePollingIntervalFlow extends Flow {
	public override async register(_fetchData: FetchData): Promise<void> {
		const card = this.device.homey.flow.getActionCard(
			"update_polling_interval",
		);

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(args: UpdatePollingIntervalArgs): Promise<void> {
		if (!args.interval || args.interval < 1) {
			throw new Error(this.__("flows.polling_interval.invalid"));
		}

		await this.device.setSettings({
			pollingInterval: +args.interval,
		});
	}
}
