import {
	type ClimatisationSettingsArgs,
	buildClimatisationSettings,
	hasSettingsToUpdate,
} from "./climatisation-settings-utils.mjs";
import Flow from "./flow.mjs";

export default class UpdateClimatisationSettings extends Flow {
	public override async register(): Promise<void> {
		const card = this.device.homey.flow.getActionCard(
			"update_climatisation_settings",
		);

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(args: ClimatisationSettingsArgs): Promise<void> {
		const settings = buildClimatisationSettings(args);

		if (!hasSettingsToUpdate(settings)) {
			return;
		}

		const vehicle = await this.device.getVehicle();
		await vehicle.updateClimatisation(settings);

		await this.device.requestRefresh(500, 1000);
	}
}
