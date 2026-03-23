import type { ClimatisationSettings } from "#lib/api/climatisation.mjs";
import type VagDevice from "#lib/drivers/vag-device.mjs";
import Flow from "./flow.mjs";

interface ControlClimatisationOnArgs {
	device: VagDevice;
	temperature?: number;
}

interface ControlClimatisationOnAdvancedArgs {
	device: VagDevice;
	temperature?: number;
	climatisationWithoutExternalPower?: boolean;
	climatizationAtUnlock?: boolean;
	windowHeatingEnabled?: boolean;
	zoneFrontLeftEnabled?: boolean;
	zoneFrontRightEnabled?: boolean;
	zoneRearLeftEnabled?: boolean;
	zoneRearRightEnabled?: boolean;
}

interface ControlClimatisationOffArgs {
	device: VagDevice;
}

export default class ControlClimatisationFlow extends Flow {
	public override async register(): Promise<void> {
		const onCard = this.app.homey.flow.getActionCard("climatisation_onoff_on");
		const onAdvancedCard = this.app.homey.flow.getActionCard(
			"climatisation_onoff_on_advanced",
		);
		const offCard = this.app.homey.flow.getActionCard(
			"climatisation_onoff_off",
		);

		onCard.registerRunListener(this.handleOn.bind(this));
		onAdvancedCard.registerRunListener(this.handleOnAdvanced.bind(this));
		offCard.registerRunListener(this.handleOff.bind(this));
	}

	private async handleOn(args: ControlClimatisationOnArgs): Promise<void> {
		const vehicle = await args.device.getVehicle();

		await vehicle
			.startClimatisation({
				targetTemperature: args.temperature,
				targetTemperatureUnit: "celsius",
			})
			.catch((e) => args.device.errorAndThrow(e));

		await args.device.requestRefresh(500, 1000);
	}

	private async handleOnAdvanced(
		args: ControlClimatisationOnAdvancedArgs,
	): Promise<void> {
		const vehicle = await args.device.getVehicle();

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
			.catch((e) => args.device.errorAndThrow(e));

		await args.device.requestRefresh(500, 1000);
	}

	private async handleOff({
		device,
	}: ControlClimatisationOffArgs): Promise<void> {
		const vehicle = await device
			.getVehicle()
			.catch((e) => device.errorAndThrow(e));

		await vehicle.stopClimatisation().catch((e) => device.errorAndThrow(e));

		await device.requestRefresh(500, 1000);
	}
}
