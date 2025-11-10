import Flow from "./flow.mjs";

interface ControlChargingArgs {
	action: "start" | "stop";
}

export default class ControlCharging extends Flow {
	private readonly timeouts: NodeJS.Timeout[] = [];

	public override async register(): Promise<void> {
		const card = this.device.homey.flow.getActionCard("control_charging");

		card.registerRunListener(this.handleAction.bind(this));
	}

	public override async unregister(): Promise<void> {
		for (const timeout of this.timeouts) {
			clearTimeout(timeout);
		}
	}

	private async handleAction(args: ControlChargingArgs): Promise<void> {
		const vehicle = await this.device.getVehicle();

		if (args.action === "start") {
			await vehicle.startCharging();
		} else {
			await vehicle.stopCharging();
		}

		this.timeouts.push(setTimeout(() => this.device.setCapabilities(), 3000));
	}
}
