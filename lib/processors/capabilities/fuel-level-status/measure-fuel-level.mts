import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class MeasureFuelLevelCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "measure_fuel_level";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const fuelLevel =
			capabilities.measurements?.fuelLevelStatus?.value?.currentFuelLevel_pct;

		if (!this.isNumber(fuelLevel)) {
			throw new InvalidValueError(fuelLevel);
		}

		return fuelLevel;
	}
}
