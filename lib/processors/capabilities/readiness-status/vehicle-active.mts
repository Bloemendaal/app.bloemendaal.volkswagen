import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class VehicleActiveCapability extends Capability<boolean> {
	protected getCapabilityName(): string {
		return "vehicle_active";
	}

	public override async getter({ capabilities }: FetchData): Promise<boolean> {
		const isActive =
			capabilities.readiness?.readinessStatus?.value?.connectionState.isActive;

		if (typeof isActive !== "boolean") {
			throw new InvalidValueError(isActive);
		}

		return isActive;
	}
}
