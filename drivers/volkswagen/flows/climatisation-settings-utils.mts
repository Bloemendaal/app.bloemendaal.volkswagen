import type { ClimatisationSettings } from "../api/climatisation.mjs";

export interface ClimatisationSettingsArgs {
	target_temperature?: number;
	climatisation_at_unlock: "true" | "false" | "unchanged";
	window_heating: "true" | "false" | "unchanged";
}

export function buildClimatisationSettings(
	args: ClimatisationSettingsArgs,
): ClimatisationSettings {
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

	return settings;
}

export function hasSettingsToUpdate(settings: ClimatisationSettings): boolean {
	return Object.keys(settings).length > 1; // More than just targetTemperatureUnit
}
