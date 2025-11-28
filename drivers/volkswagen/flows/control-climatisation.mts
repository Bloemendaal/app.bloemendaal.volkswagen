import Flow from "./flow.mjs";

export default class ControlClimatisation extends Flow {
	public override async register(): Promise<void> {
		const onCard = this.device.homey.flow.getActionCard(
			"climatisation_onoff_on",
		);
		const offCard = this.device.homey.flow.getActionCard(
			"climatisation_onoff_off",
		);

		onCard.registerRunListener(this.handleOn.bind(this));
		offCard.registerRunListener(this.handleOff.bind(this));
	}

	private async handleOn(args: { temperature?: number }): Promise<void> {
		const vehicle = await this.device.getVehicle();

		await vehicle.startClimatisation({
			targetTemperature: args.temperature,
			targetTemperatureUnit: "celsius",
		});

		await this.device.requestRefresh(500, 1000);
	}

	private async handleOff(): Promise<void> {
		const vehicle = await this.device.getVehicle();

		await vehicle.stopClimatisation();

		await this.device.requestRefresh(500, 1000);
	}
}
