import type { ChargingSettings } from "#lib/api/vehicles/vag-vehicle.mjs";
import type VagDevice from "#lib/drivers/vag-device.mjs";
import Flow from "./flow.mjs";

interface UpdateChargingSettingsHybridArgs {
	device: VagDevice;
	reduced_charging: "yes" | "no";
}

export default class UpdateChargingSettingsHybridFlow extends Flow {
	public override async register(): Promise<void> {
		const card = this.app.homey.flow.getActionCard(
			"update_charge_settings_hybrid",
		);

		card.registerRunListener(this.handleAction.bind(this));
	}

	private async handleAction(
		args: UpdateChargingSettingsHybridArgs,
	): Promise<void> {
		const vehicle = await args.device
			.getVehicle()
			.catch((e) => args.device.errorAndThrow(e));

		const settings: Partial<ChargingSettings> = {
			chargingSettingsAC: {
				maxChargeCurrentAC:
					args.reduced_charging === "yes" ? "reduced" : "maximum",
			},
		};

		await vehicle
			.updateChargingSettings(settings)
			.catch((e) => args.device.errorAndThrow(e));

		await args.device.requestRefresh(500, 1000);
	}
}
