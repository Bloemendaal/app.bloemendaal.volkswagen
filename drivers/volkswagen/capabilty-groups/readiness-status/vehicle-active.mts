import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class VehicleActiveCapability extends Capability<boolean> {
	protected getCapabilityName(): string {
		return "vehicle_active";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<boolean> => {
		const isActive =
			capabilities.readiness?.readinessStatus?.value?.connectionState.isActive;

		if (typeof isActive !== "boolean") {
			throw new InvalidValueError(isActive);
		}

		return isActive;
	};
}
