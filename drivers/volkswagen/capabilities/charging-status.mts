import Capability, { type VehicleData } from "./capability.mjs";

export default class ChargingStatus extends Capability {
	private lastPlugConnectionState: string | null = null;
	private lastIsCharging: boolean | null = null;

	private isValidChargingState(value: string | null = null): value is string {
		return Boolean(value) && value !== "unsupported";
	}

	private isChargingActive(chargingState: string): boolean {
		return chargingState === "charging";
	}

	protected override getCapabilityName(): string {
		return "charging_status";
	}

	public override async addCapabilities({
		capabilities,
	}: VehicleData): Promise<void> {
		await this.addTimestampCapability(
			capabilities.charging?.chargingStatus.value.carCapturedTimestamp,
		);

		const hasValidChargingState = this.isValidChargingState(
			capabilities.charging?.chargingStatus.value.chargingState,
		);

		if (
			hasValidChargingState &&
			!this.volkswagenDevice.hasCapability("ev_charging_state")
		) {
			await this.volkswagenDevice.addCapability("ev_charging_state");
		}

		const hasValidChargePower = this.isNumber(
			capabilities.charging?.chargingStatus.value.chargePower_kW,
		);

		if (
			hasValidChargePower &&
			!this.volkswagenDevice.hasCapability("measure_charging_power")
		) {
			await this.volkswagenDevice.addCapability("measure_charging_power");
		}

		const hasValidChargeRate = this.isNumber(
			capabilities.charging?.chargingStatus.value.chargeRate_kmph,
		);

		if (
			hasValidChargeRate &&
			!this.volkswagenDevice.hasCapability("measure_charging_rate")
		) {
			await this.volkswagenDevice.addCapability("measure_charging_rate");
		}

		const remainingTime = this.isNumber(
			capabilities.charging?.chargingStatus.value
				.remainingChargingTimeToComplete_min,
		);

		if (
			remainingTime &&
			!this.volkswagenDevice.hasCapability("measure_remaining_charging_time")
		) {
			await this.volkswagenDevice.addCapability(
				"measure_remaining_charging_time",
			);
		}
	}

	public override async setCapabilityValues({
		capabilities,
	}: VehicleData): Promise<void> {
		const hasNewerTimestamp = await this.checkTimestamp(
			capabilities.charging?.batteryStatus.value.carCapturedTimestamp,
		);

		if (!hasNewerTimestamp) {
			return;
		}

		// Check plug connection state changes for triggers
		const plugConnectionState =
			capabilities.charging?.plugStatus.value.plugConnectionState;

		if (plugConnectionState) {
			await this.handlePlugConnectionStateChange(plugConnectionState);
		}

		const chargingState =
			capabilities.charging?.chargingStatus.value.chargingState;

		// Check charging state changes for triggers
		if (this.isValidChargingState(chargingState)) {
			await this.handleChargingStateChange(chargingState);
		}

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

	private async handlePlugConnectionStateChange(
		plugConnectionState: string,
	): Promise<void> {
		// Only trigger if we have a previous state to compare against
		if (this.lastPlugConnectionState === null) {
			this.lastPlugConnectionState = plugConnectionState;
			return;
		}

		// Check if the state has changed
		if (this.lastPlugConnectionState === plugConnectionState) {
			return;
		}

		const previousState = this.lastPlugConnectionState;
		this.lastPlugConnectionState = plugConnectionState;

		// Trigger the appropriate flow card
		if (
			previousState === "disconnected" &&
			plugConnectionState === "connected"
		) {
			await this.volkswagenDevice.homey.flow
				.getDeviceTriggerCard("charge_cable_connected")
				.trigger(this.volkswagenDevice)
				.catch(() => {
					// Ignore errors if trigger card is not registered
				});
		} else if (
			previousState === "connected" &&
			plugConnectionState === "disconnected"
		) {
			await this.volkswagenDevice.homey.flow
				.getDeviceTriggerCard("charge_cable_disconnected")
				.trigger(this.volkswagenDevice)
				.catch(() => {
					// Ignore errors if trigger card is not registered
				});
		}
	}

	private async handleChargingStateChange(
		chargingState: string,
	): Promise<void> {
		const isCurrentlyCharging = this.isChargingActive(chargingState);

		// Only trigger if we have a previous state to compare against
		if (this.lastIsCharging === null) {
			this.lastIsCharging = isCurrentlyCharging;
			return;
		}

		// Check if the charging state has changed
		if (this.lastIsCharging === isCurrentlyCharging) {
			return;
		}

		const wasCharging = this.lastIsCharging;
		this.lastIsCharging = isCurrentlyCharging;

		// Trigger the appropriate flow card
		if (!wasCharging && isCurrentlyCharging) {
			await this.volkswagenDevice.homey.flow
				.getDeviceTriggerCard("charging_started")
				.trigger(this.volkswagenDevice)
				.catch(() => {
					// Ignore errors if trigger card is not registered
				});
		} else if (wasCharging && !isCurrentlyCharging) {
			await this.volkswagenDevice.homey.flow
				.getDeviceTriggerCard("charging_stopped")
				.trigger(this.volkswagenDevice)
				.catch(() => {
					// Ignore errors if trigger card is not registered
				});
		}
	}
}
