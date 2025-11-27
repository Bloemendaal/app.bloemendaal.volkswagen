import type { ClimatisationSettings } from "../api/climatisation.mjs";
import Flow from "./flow.mjs";

interface UpdateClimatisationSettingsArgs {
	target_temperature?: number;
	climatisation_at_unlock: "true" | "false" | "unchanged";
	window_heating: "true" | "false" | "unchanged";
}

export default class UpdateClimatisationSettings extends Flow {
	public override async register(): Promise<void> {
		const card = this.device.homey.flow.getActionCard(
			"update_climatisation_settings",
		);

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(
		args: UpdateClimatisationSettingsArgs,
	): Promise<void> {
		const vehicle = await this.device.getVehicle();

		const settings: ClimatisationSettings = {
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

		if (Object.keys(settings).length === 1) {
			// Only targetTemperatureUnit is set, nothing to update
			return;
		}

		await vehicle.updateClimatisation(settings);

		await this.device.requestRefresh(500, 1000);
	}
}
