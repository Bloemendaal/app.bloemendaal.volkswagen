import type { StartClimatisationSettings as StartClimatisationSettingsType } from "../api/climatisation.mjs";
import Flow from "./flow.mjs";

interface StartClimatisationSettingsArgs {
	target_temperature?: number;
	climatisation_at_unlock: "true" | "false" | "unchanged";
	window_heating: "true" | "false" | "unchanged";
}

export default class StartClimatisationSettings extends Flow {
	public override async register(): Promise<void> {
		const card = this.device.homey.flow.getActionCard(
			"start_climatisation_settings",
		);

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(
		args: StartClimatisationSettingsArgs,
	): Promise<void> {
		const vehicle = await this.device.getVehicle();

		const settings: StartClimatisationSettingsType = {
			targetTemperatureUnit: "celsius",
		};

		if (args.target_temperature !== undefined) {
			settings.targetTemperature = args.target_temperature;
		}

		if (args.climatisation_at_unlock !== "unchanged") {
			settings.climatizationAtUnlock = args.climatisation_at_unlock === "true";
		}

		if (args.window_heating !== "unchanged") {
			settings.windowHeatingEnabled = args.window_heating === "true";
		}

		await vehicle.startClimatisation(settings);

		await this.device.requestRefresh(500, 1000);
	}
}
