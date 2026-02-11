import Flow from "./flow.mjs";

interface ControlChargingArgs {
	action: "start" | "stop";
}

export default class ControlChargingFlow extends Flow {
	public override async register(): Promise<void> {
		const card = this.device.homey.flow.getActionCard("control_charging");

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(args: ControlChargingArgs): Promise<void> {
		const vehicle = await this.device
			.getVehicle()
			.catch((e) => this.device.errorAndThrow(e));

		if (args.action === "start") {
			await vehicle.startCharging().catch((e) => this.device.errorAndThrow(e));
		} else {
			await vehicle.stopCharging().catch((e) => this.device.errorAndThrow(e));
		}

		await this.device.requestRefresh(500, 1000);
	}
}
