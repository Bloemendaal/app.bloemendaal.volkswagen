import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class TargetSocCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "target_soc";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const targetSoC =
			capabilities.charging?.chargingSettings?.value?.targetSOC_pct;

		if (!this.isNumber(targetSoC)) {
			throw new InvalidValueError(targetSoC);
		}

		return targetSoC;
	}

	public override async setter(_fetchData: FetchData): Promise<void> {
		this.vagDevice.registerCapabilityListener(
			this.getCapabilityName(),
			async (value: number) => {
				const vehicle = await this.vagDevice.getVehicle();

				await vehicle.updateChargingSettings({
					targetSOC_pct: Math.round(value),
				});
			},
		);
	}
}
