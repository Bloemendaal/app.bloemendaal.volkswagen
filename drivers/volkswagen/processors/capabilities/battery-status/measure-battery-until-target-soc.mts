import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class MeasureBatteryUntilTargetSocCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_battery.until_target_soc";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const currentSoC =
			capabilities.charging?.batteryStatus?.value?.currentSOC_pct;

		const targetSoC =
			capabilities.charging?.chargingSettings?.value?.targetSOC_pct;

		if (!this.isNumber(currentSoC) || !this.isNumber(targetSoC)) {
			throw new InvalidValueError({ currentSoC, targetSoC });
		}

		return Math.max(0, targetSoC - currentSoC);
	}

	public override async setter(_fetchData: FetchData): Promise<void> {
		this.device.setCapabilityOptions(this.getCapabilityName(), {
			uiComponent: "sensor",
			title: this.device.homey.__("capabilities.measure_battery.title", {
				name: this.device.homey.__(
					"capabilities.measure_battery.variables.until_target_soc",
				),
			}),
		});
	}
}
