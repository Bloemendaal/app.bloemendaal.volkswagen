import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class IsPlugConnectedCapability extends Capability<boolean> {
	protected getCapabilityName(): string {
		return "is_plug_connected";
	}

	public override async getter({ capabilities }: FetchData): Promise<boolean> {
		const plugConnectionState =
			capabilities.charging?.plugStatus?.value?.plugConnectionState;

		if (!plugConnectionState || plugConnectionState === "unsupported") {
			throw new InvalidValueError(plugConnectionState);
		}

		return plugConnectionState === "connected";
	}
}
