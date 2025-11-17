import Flow from "./flow.mjs";

interface ControlChargingArgs {
	action: "start" | "stop";
}

export default class ControlCharging extends Flow {
	public override async register(): Promise<void> {
		const card = this.device.homey.flow.getActionCard("control_charging");

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(args: ControlChargingArgs): Promise<void> {
		const vehicle = await this.device.getVehicle();

		if (args.action === "start") {
			await vehicle.startCharging();
		} else {
			await vehicle.stopCharging();
		}

		await this.device.requestRefresh(500, 1000);
	}
}
