import Flow from "./flow.mjs";

interface ControlChargingArgs {
	action: "start" | "stop";
}

export default class ControlChargingFlow extends Flow {
	public override async register(): Promise<void> {
    const card = this.baseDevice.homey.flow.getActionCard("control_charging");

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(args: ControlChargingArgs): Promise<void> {
    const vehicle = await this.baseDevice
			.getVehicle()
      .catch((e: Error) => this.baseDevice.errorAndThrow(e));

		if (args.action === "start") {
      await vehicle
        .startCharging()
        .catch((e: Error) => this.baseDevice.errorAndThrow(e));
		} else {
      await vehicle
        .stopCharging()
        .catch((e: Error) => this.baseDevice.errorAndThrow(e));
		}

    await this.baseDevice.requestRefresh(500, 1000);
	}
}
