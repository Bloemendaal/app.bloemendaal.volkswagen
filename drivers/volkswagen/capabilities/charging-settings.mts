import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.mjs";
import Capability from "./capability.mjs";

export default class ChargingSettings extends Capability {
	protected override getCapabilityName(): string {
		return "charging_settings";
	}

	public override async addCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		await this.addTimestampCapability(
			capabilities.charging?.chargingSettings.value.carCapturedTimestamp,
		);

		const hasValidTargetSoC = this.isNumber(
			capabilities.charging?.chargingSettings.value.targetSOC_pct,
		);

		if (
			hasValidTargetSoC &&
			!this.volkswagenDevice.hasCapability("target_soc")
		) {
			await this.volkswagenDevice.addCapability("target_soc");
		}
	}

	public override async setCapabilityValues(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const hasNewerTimestamp = await this.checkTimestamp(
			capabilities.charging?.batteryStatus.value.carCapturedTimestamp,
		);

		if (!hasNewerTimestamp) {
			return;
		}

		const targetSoC =
			capabilities.charging?.chargingSettings.value.targetSOC_pct;

		const hasValidTargetSoC = this.isNumber(targetSoC);

		if (
			hasValidTargetSoC &&
			this.volkswagenDevice.hasCapability("target_soc")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"target_soc",
				targetSoC / 100,
			);
		}
	}

	public override async registerCapabilityListeners(): Promise<void> {
		if (this.volkswagenDevice.hasCapability("target_soc")) {
			this.volkswagenDevice.registerCapabilityListener(
				"target_soc",
				async (value: number) => {
					const vehicle = await this.volkswagenDevice.getVehicle();
					await vehicle.updateChargingSettings({
						targetSOC_pct: Math.round(value * 100),
					});
				},
			);
		}
	}
}
