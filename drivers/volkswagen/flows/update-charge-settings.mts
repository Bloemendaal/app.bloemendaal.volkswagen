import type { ChargingSettings } from "../api/vehicle.mjs";
import Flow from "./flow.mjs";

interface UpdateChargingSettingsArgs {
	max_charge_current?: "5" | "10" | "13" | "32" | "reduced" | "maximum";
	target_soc?: number;
	auto_unlock?: "true" | "false";
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

		const settings: ChargingSettings = {};

		if (args.max_charge_current !== undefined) {
			if (
				args.max_charge_current === "reduced" ||
				args.max_charge_current === "maximum"
			) {
				settings.maxChargeCurrentAC = args.max_charge_current;
			} else {
				settings.maxChargeCurrentAC = Number.parseInt(
					args.max_charge_current,
					10,
				);
			}
		}

		if (args.target_soc !== undefined) {
			settings.targetSOC_pct = args.target_soc;
		}

		if (args.auto_unlock !== undefined) {
			settings.autoUnlockPlugWhenChargedAC = Boolean(args.auto_unlock);
		}

		await vehicle.updateChargingSettings(settings);

		this.timeouts.push(setTimeout(() => this.device.setCapabilities(), 3000));
	}
}
