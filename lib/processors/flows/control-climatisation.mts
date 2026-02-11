import type { ClimatisationSettings } from "#lib/api/climatisation.mjs";
import Flow from "./flow.mjs";

export default class ControlClimatisationFlow extends Flow {
	public override async register(): Promise<void> {
		const onCard = this.device.homey.flow.getActionCard(
			"climatisation_onoff_on",
		);
		const onAdvancedCard = this.device.homey.flow.getActionCard(
			"climatisation_onoff_on_advanced",
		);
		const offCard = this.device.homey.flow.getActionCard(
			"climatisation_onoff_off",
		);

		onCard.registerRunListener(this.handleOn.bind(this));
		onAdvancedCard.registerRunListener(this.handleOnAdvanced.bind(this));
		offCard.registerRunListener(this.handleOff.bind(this));
	}

	private async handleOn(args: { temperature?: number }): Promise<void> {
		const vehicle = await this.device.getVehicle();

		await vehicle
			.startClimatisation({
				targetTemperature: args.temperature,
				targetTemperatureUnit: "celsius",
			})
			.catch((e) => this.device.errorAndThrow(e));

		await this.device.requestRefresh(500, 1000);
	}

	private async handleOnAdvanced(args: {
		temperature?: number;
		climatisationWithoutExternalPower?: boolean;
		climatizationAtUnlock?: boolean;
		windowHeatingEnabled?: boolean;
		zoneFrontLeftEnabled?: boolean;
		zoneFrontRightEnabled?: boolean;
		zoneRearLeftEnabled?: boolean;
		zoneRearRightEnabled?: boolean;
	}): Promise<void> {
		const vehicle = await this.device.getVehicle();

		const settings: ClimatisationSettings = {
			targetTemperature: args.temperature,
			targetTemperatureUnit: "celsius",
		};

		// Add optional boolean settings only if they are explicitly provided
		if (args.climatisationWithoutExternalPower !== undefined) {
			settings.climatisationWithoutExternalPower =
				args.climatisationWithoutExternalPower;
		}
		if (args.climatizationAtUnlock !== undefined) {
			settings.climatizationAtUnlock = args.climatizationAtUnlock;
		}
		if (args.windowHeatingEnabled !== undefined) {
			settings.windowHeatingEnabled = args.windowHeatingEnabled;
		}
		if (args.zoneFrontLeftEnabled !== undefined) {
			settings.zoneFrontLeftEnabled = args.zoneFrontLeftEnabled;
		}
		if (args.zoneFrontRightEnabled !== undefined) {
			settings.zoneFrontRightEnabled = args.zoneFrontRightEnabled;
		}
		if (args.zoneRearLeftEnabled !== undefined) {
			settings.zoneRearLeftEnabled = args.zoneRearLeftEnabled;
		}
		if (args.zoneRearRightEnabled !== undefined) {
			settings.zoneRearRightEnabled = args.zoneRearRightEnabled;
		}

		await vehicle
			.startClimatisation(settings)
			.catch((e) => this.device.errorAndThrow(e));

		await this.device.requestRefresh(500, 1000);
	}

	private async handleOff(): Promise<void> {
		const vehicle = await this.device
			.getVehicle()
			.catch((e) => this.device.errorAndThrow(e));

		await vehicle
			.stopClimatisation()
			.catch((e) => this.device.errorAndThrow(e));

		await this.device.requestRefresh(500, 1000);
	}
}
