import type {
	ChargingSettings,
	ChargingSettingsAC,
} from "#lib/api/vehicle.mjs";
import {
	MAX_CHARGING_CURRENT,
	REDUCED_CHARGING_CURRENT,
} from "#lib/processors/capabilities/charging-settings/max-charging-current.mjs";
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

export default class UpdateChargingSettingsFlow extends Flow {
	public override async register(): Promise<void> {
		const card = this.device.homey.flow.getActionCard("update_charge_settings");

		card.registerRunListener(this.handleAction.bind(this));
		card.registerArgumentAutocompleteListener(
			"max_charge_current",
			this.getMaxChargeCurrentOptions.bind(this),
		);
	}

	private async getMaxChargeCurrentOptions(): Promise<
		{ name: string; id: string }[]
	> {
		const expectsMaxCurrentInAmpere = this.device.getCapabilityValue(
			"expects_max_charging_current_in_ampere",
		);

		if (expectsMaxCurrentInAmpere) {
			// Show numeric ampere values
			return [
				{ name: "5A", id: "5" },
				{ name: "10A", id: "10" },
				{ name: "13A", id: "13" },
				{ name: "32A", id: "32" },
				{ name: this.__("flows.unchanged"), id: "unchanged" },
			];
		}

		// Show reduced/maximum options
		return [
			{ name: this.__("flows.charge_current.reduced"), id: "reduced" },
			{ name: this.__("flows.charge_current.maximum"), id: "maximum" },
			{ name: this.__("flows.unchanged"), id: "unchanged" },
		];
	}

	private async handleAction(args: UpdateChargingSettingsArgs): Promise<void> {
		const vehicle = await this.device
			.getVehicle()
			.catch((e) => this.device.errorAndThrow(e));

		const settings: ChargingSettings = {
			targetSOC_pct: args.target_soc,
			chargingSettingsAC: this.resolveChargingSettingsAC(args),
		};

		if (Object.keys(settings).length === 0) {
			return;
		}

		await vehicle
			.updateChargingSettings(settings)
			.catch((e) => this.device.errorAndThrow(e));

		await this.device.requestRefresh(500, 1000);
	}

	private resolveChargingSettingsAC(
		settings: UpdateChargingSettingsArgs,
	): ChargingSettingsAC | undefined {
		if (
			settings.auto_unlock === "unchanged" &&
			settings.max_charge_current === "unchanged"
		) {
			return;
		}

		const chargingSettingsAC: ChargingSettingsAC = {
			maxChargeCurrentAC: this.resolveChargeCurrent(settings),
			autoUnlockPlugWhenChargedAC: this.resolveAutoUnlock(settings),
		};

		return chargingSettingsAC;
	}

	private resolveChargeCurrent({
		max_charge_current,
	}: UpdateChargingSettingsArgs): ChargingSettingsAC["maxChargeCurrentAC"] {
		if (max_charge_current === "unchanged") {
			const currentValue = this.device.getCapabilityValue(
				"max_charging_current",
			);

			const expectsInAmpere = this.device.getCapabilityValue(
				"expects_max_charging_current_in_ampere",
			);

			if (expectsInAmpere) {
				return currentValue;
			}

			return Math.abs(MAX_CHARGING_CURRENT - currentValue) <
				Math.abs(REDUCED_CHARGING_CURRENT - currentValue)
				? "maximum"
				: "reduced";
		}

		if (max_charge_current === "maximum" || max_charge_current === "reduced") {
			return max_charge_current;
		}

		return Number.parseInt(max_charge_current, 10);
	}

	private resolveAutoUnlock({
		auto_unlock,
	}: UpdateChargingSettingsArgs): boolean {
		if (auto_unlock === "unchanged") {
			return this.device.getCapabilityValue("auto_unlock_plug_when_charged");
		}

		return auto_unlock === "true";
	}
}
