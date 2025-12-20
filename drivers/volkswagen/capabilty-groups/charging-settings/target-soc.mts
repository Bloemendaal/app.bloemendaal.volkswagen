import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class TargetSocCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "target_soc";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<number> => {
		const targetSoC =
			capabilities.charging?.chargingSettings?.value?.targetSOC_pct;

		if (!this.isNumber(targetSoC)) {
			throw new InvalidValueError(targetSoC);
		}

		return targetSoC;
	};

	public override setter = async (value: number): Promise<void> => {
		const vehicle = await this.volkswagenDevice.getVehicle();

		await vehicle.updateChargingSettings({
			targetSOC_pct: Math.round(value),
		});
	};
}
