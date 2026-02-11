import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class VehicleOnlineCapability extends Capability<boolean> {
	protected getCapabilityName(): string {
		return "vehicle_online";
	}

	public override async getter({ capabilities }: FetchData): Promise<boolean> {
		const isOnline =
			capabilities.readiness?.readinessStatus?.value?.connectionState.isOnline;

		if (typeof isOnline !== "boolean") {
			throw new InvalidValueError(isOnline);
		}

		return isOnline;
	}
}
