import Flow from "./flow.mjs";

export default class ControlClimatisationFlow extends Flow {
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

		await vehicle
			.startClimatisation({
				targetTemperature: args.temperature,
				targetTemperatureUnit: "celsius",
			})
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
