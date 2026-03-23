import type { FlowCard } from "homey";
import type {
	ChargingSettings,
	ChargingSettingsAC,
} from "#lib/api/vehicles/vag-vehicle.mjs";
import type VagDevice from "#lib/drivers/vag-device.mjs";
import {
	MAX_CHARGING_CURRENT,
	REDUCED_CHARGING_CURRENT,
} from "#lib/processors/capabilities/charging-settings/max-charging-current.mjs";
import Flow from "./flow.mjs";

interface UpdateChargingSettingsArgs {
	device: VagDevice;
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
		const card = this.app.homey.flow.getActionCard("update_charge_settings");

		card.registerRunListener(this.handleAction.bind(this));
		card.registerArgumentAutocompleteListener(
			"max_charge_current",
			this.getMaxChargeCurrentOptions.bind(this),
		);
	}

	private getMaxChargeCurrentOptions(
		query: string,
		args: UpdateChargingSettingsArgs,
	): FlowCard.ArgumentAutocompleteResults {
		const expectsMaxCurrentInAmpere = args.device.getCapabilityValue(
			"expects_max_charging_current_in_ampere",
		);

		if (expectsMaxCurrentInAmpere) {
			// Show numeric ampere values
			return this.applyQuery(query, [
				{ name: "5A", id: "5" },
				{ name: "10A", id: "10" },
				{ name: "13A", id: "13" },
				{ name: "32A", id: "32" },
				{ name: this.__("flows.unchanged"), id: "unchanged" },
			]);
		}

		// Show reduced/maximum options
		return this.applyQuery(query, [
			{ name: this.__("flows.charge_current.reduced"), id: "reduced" },
			{ name: this.__("flows.charge_current.maximum"), id: "maximum" },
			{ name: this.__("flows.unchanged"), id: "unchanged" },
		]);
	}

	private applyQuery(
		query: string,
		options: FlowCard.ArgumentAutocompleteResults,
	): FlowCard.ArgumentAutocompleteResults {
		if (!query.trim()) {
			return options;
		}

		const keywords = query.toLowerCase().split(/\s+/);

		return options.filter((option) =>
			keywords.every((keyword) => option.name.toLowerCase().includes(keyword)),
		);
	}

	private async handleAction(args: UpdateChargingSettingsArgs): Promise<void> {
		const vehicle = await args.device
			.getVehicle()
			.catch((e) => args.device.errorAndThrow(e));

		const settings: ChargingSettings = {
			targetSOC_pct: args.target_soc,
			chargingSettingsAC: this.resolveChargingSettingsAC(args),
		};

		if (Object.keys(settings).length === 0) {
			return;
		}

		await vehicle
			.updateChargingSettings(settings)
			.catch((e) => args.device.errorAndThrow(e));

		await args.device.requestRefresh(500, 1000);
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
		device,
		max_charge_current,
	}: UpdateChargingSettingsArgs): ChargingSettingsAC["maxChargeCurrentAC"] {
		if (max_charge_current === "unchanged") {
			const currentValue = device.getCapabilityValue("max_charging_current");

			const expectsInAmpere = device.getCapabilityValue(
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
		device,
		auto_unlock,
	}: UpdateChargingSettingsArgs): boolean {
		if (auto_unlock === "unchanged") {
			return device.getCapabilityValue("auto_unlock_plug_when_charged");
		}

		return auto_unlock === "true";
	}
}
