import Flow from "./flow.mjs";

interface UpdateChargingSettingsArgs {
	max_charge_current: "5" | "10" | "13" | "32" | "reduced" | "maximum";
	target_soc: number;
	auto_unlock: boolean;
}

export default class UpdateChargingSettings extends Flow {
	private readonly timeouts: NodeJS.Timeout[] = [];

	public override async register(): Promise<void> {
		const card = this.device.homey.flow.getActionCard("update_charge_settings");

		card.registerRunListener(this.handleAction.bind(this));
	}

	public override async unregister(): Promise<void> {
		for (const timeout of this.timeouts) {
			clearTimeout(timeout);
		}
	}

	private async handleAction(args: UpdateChargingSettingsArgs): Promise<void> {
		const vehicle = await this.device.getVehicle();

		await vehicle.updateChargingSettings({
			targetSOC_pct: args.target_soc,
			autoUnlockPlugWhenChargedAC: args.auto_unlock,
			maxChargeCurrentAC:
				args.max_charge_current === "reduced" ||
				args.max_charge_current === "maximum"
					? args.max_charge_current
					: Number.parseInt(args.max_charge_current, 10),
		});

		this.timeouts.push(setTimeout(() => this.device.setCapabilities(), 3000));
	}
}
