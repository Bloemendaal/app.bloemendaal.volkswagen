import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class VehicleOnlineCapability extends Capability<boolean> {
	protected getCapabilityName(): string {
		return "vehicle_online";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<boolean> => {
		const isOnline =
			capabilities.readiness?.readinessStatus?.value?.connectionState.isOnline;

		if (typeof isOnline !== "boolean") {
			throw new InvalidValueError(isOnline);
		}

		return isOnline;
	};
}
