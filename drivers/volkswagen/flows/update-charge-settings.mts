import type { ChargingSettings } from "../api/vehicle.mjs";
import Flow from "./flow.mjs";

interface UpdateChargingSettingsArgs {
	max_charge_current:
		| "5"
		| "10"
		| "13"
		| "32"
		| "reduced"
		| "maximum"
		| "unchanged";
	target_soc?: number;
	auto_unlock: "true" | "false" | "unchanged";
}

export default class UpdateChargingSettings extends Flow {
	public override async register(): Promise<void> {
		const card = this.device.homey.flow.getActionCard("update_charge_settings");

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(args: UpdateChargingSettingsArgs): Promise<void> {
		const vehicle = await this.device.getVehicle();

		const settings: ChargingSettings = {};

		if (args.max_charge_current !== "unchanged") {
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

		if (args.auto_unlock !== "unchanged") {
			settings.autoUnlockPlugWhenChargedAC = args.auto_unlock === "true";
		}

		if (Object.keys(settings).length === 0) {
			return;
		}

		await vehicle.updateChargingSettings(settings);

		await this.device.requestRefresh(500, 1000);
	}
}
