import type { ChargingSettings } from "../../api/vehicles/base-vehicle.mjs";
import Flow from "./flow.mjs";

interface UpdateChargingSettingsHybridArgs {
	reduced_charging: "yes" | "no";
}

export default class UpdateChargingSettingsHybridFlow extends Flow {
	public override async register(): Promise<void> {
		const card = this.device.homey.flow.getActionCard(
			"update_charge_settings_hybrid",
		);

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(
		args: UpdateChargingSettingsHybridArgs,
	): Promise<void> {
		const vehicle = await this.device
			.getVehicle()
			.catch((e) => this.device.errorAndThrow(e));

		const settings: Partial<ChargingSettings> = {
			chargingSettingsAC: {
				maxChargeCurrentAC:
					args.reduced_charging === "yes" ? "reduced" : "maximum",
			},
		};

		await vehicle
			.updateChargingSettings(settings)
			.catch((e) => this.device.errorAndThrow(e));

		await this.device.requestRefresh(500, 1000);
	}
}
