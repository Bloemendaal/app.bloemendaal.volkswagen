import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class IsParkedCapability extends Capability<boolean> {
	protected getCapabilityName(): string {
		return "is_parked";
	}

	public override async getter({
		parkingPosition,
	}: FetchData): Promise<boolean> {
		if (!parkingPosition) {
			throw new InvalidValueError(parkingPosition);
		}

		return parkingPosition.parked;
	}

	/**
	 * Ensure that when the carCapturedTimestamp doesn't exist, we
	 * still set this value because we know this by the status code
	 * and not by an actual value from the API JSON response.
	 */
	protected override shouldSetCapabilityValue(): boolean {
		return true;
	}
}
