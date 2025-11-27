import {
	type ClimatisationSettingsArgs,
	buildClimatisationSettings,
} from "./climatisation-settings-utils.mjs";
import Flow from "./flow.mjs";

export default class StartClimatisationSettings extends Flow {
	public override async register(): Promise<void> {
		const card = this.device.homey.flow.getActionCard(
			"start_climatisation_settings",
		);

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(args: ClimatisationSettingsArgs): Promise<void> {
		const settings = buildClimatisationSettings(args);

		const vehicle = await this.device.getVehicle();
		await vehicle.startClimatisation(settings);

		await this.device.requestRefresh(500, 1000);
	}
}
