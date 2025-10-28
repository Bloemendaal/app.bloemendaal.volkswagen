import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.js";
import Capability from "./capability.js";

export default class ChargingStatus extends Capability {
	private isNumber(value: unknown): value is number {
		return typeof value === "number" && !Number.isNaN(value);
	}

	private isValidChargingState(value: string | null = null): value is string {
		return Boolean(value) && value !== "unsupported";
	}

	protected override getCapabilityName(): string {
		return "charging_status";
	}

	public override async addCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const promises: Promise<void>[] = [
			this.addTimestampCapability(
				capabilities.charging?.chargingStatus.value.carCapturedTimestamp,
			),
		];

		const hasValidChargingState = this.isValidChargingState(
			capabilities.charging?.chargingStatus.value.chargingState,
		);

		if (
			hasValidChargingState &&
			!this.volkswagenDevice.hasCapability("ev_charging_state")
		) {
			promises.push(this.volkswagenDevice.addCapability("ev_charging_state"));
		}

		const hasValidChargePower = this.isNumber(
			capabilities.charging?.chargingStatus.value.chargePower_kW,
		);

		if (
			hasValidChargePower &&
			!this.volkswagenDevice.hasCapability("measure_charging_power")
		) {
			promises.push(
				this.volkswagenDevice.addCapability("measure_charging_power"),
			);
		}

		const hasValidChargeRate = this.isNumber(
			capabilities.charging?.chargingStatus.value.chargeRate_kmph,
		);

		if (
			hasValidChargeRate &&
			!this.volkswagenDevice.hasCapability("measure_charging_rate")
		) {
			promises.push(
				this.volkswagenDevice.addCapability("measure_charging_rate"),
			);
		}

		const remainingTime = this.isNumber(
			capabilities.charging?.chargingStatus.value
				.remainingChargingTimeToComplete_min,
		);

		if (
			remainingTime &&
			!this.volkswagenDevice.hasCapability("measure_remaining_charging_time")
		) {
			promises.push(
				this.volkswagenDevice.addCapability("measure_remaining_charging_time"),
			);
		}

		await Promise.all(promises);
	}

	public override async setCapabilityValues(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const hasNewerTimestamp = await this.checkTimestamp(
			capabilities.charging?.batteryStatus.value.carCapturedTimestamp,
		);

		if (!hasNewerTimestamp) {
			return;
		}

		const chargingState =
			capabilities.charging?.chargingStatus.value.chargingState;

		if (
			this.isValidChargingState(chargingState) &&
			this.volkswagenDevice.hasCapability("ev_charging_state")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"ev_charging_state",
				{
					off: "plugged_out",
					readyForCharging: "plugged_in",
					notReadyForCharging: "plugged_out",
					conservation: null,
					chargePurposeReachedAndNotConservationCharging: null,
					chargePurposeReachedAndConservation: null,
					charging: "plugged_in_charging",
					error: "plugged_in_paused",
					unsupported: null,
					discharging: "plugged_in_discharging",
				}[chargingState],
			);
		}

		const chargePower =
			capabilities.charging?.chargingStatus.value.chargePower_kW;

		if (
			this.isNumber(chargePower) &&
			this.volkswagenDevice.hasCapability("measure_charging_power")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"measure_charging_power",
				chargePower,
			);
		}

		const chargeRate =
			capabilities.charging?.chargingStatus.value.chargeRate_kmph;

		if (
			this.isNumber(chargeRate) &&
			this.volkswagenDevice.hasCapability("measure_charging_rate")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"measure_charging_rate",
				chargeRate,
			);
		}

		const remainingTime =
			capabilities.charging?.chargingStatus.value
				.remainingChargingTimeToComplete_min;

		if (
			this.isNumber(remainingTime) &&
			this.volkswagenDevice.hasCapability("measure_remaining_charging_time")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"measure_remaining_charging_time",
				remainingTime,
			);
		}
	}
}
