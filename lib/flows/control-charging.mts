import type VagDevice from "#lib/drivers/vag-device.mjs";
import Flow from "./flow.mjs";

interface ControlChargingArgs {
	action: "start" | "stop";
	device: VagDevice;
}

export default class ControlChargingFlow extends Flow {
	public override async register(): Promise<void> {
		const card = this.app.homey.flow.getActionCard("control_charging");

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(args: ControlChargingArgs): Promise<void> {
		const vehicle = await args.device
			.getVehicle()
			.catch((e) => args.device.errorAndThrow(e));

		if (args.action === "start") {
			await vehicle.startCharging().catch((e) => args.device.errorAndThrow(e));
		} else {
			await vehicle.stopCharging().catch((e) => args.device.errorAndThrow(e));
		}

		await args.device.requestRefresh(500, 1000);
	}
}
