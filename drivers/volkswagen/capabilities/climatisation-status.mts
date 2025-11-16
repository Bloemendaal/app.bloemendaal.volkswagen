import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.mjs";
import Capability from "./capability.mjs";

export default class ClimatisationStatus extends Capability {
	private isValidClimatisationState(
		value: string | null = null,
	): value is string {
		return Boolean(value) && value !== "unsupported";
	}

	protected override getCapabilityName(): string {
		return "climatisation_status";
	}

	public override async addCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		await this.addTimestampCapability(
			capabilities.climatisation?.climatisationStatus.value
				.carCapturedTimestamp,
		);

		const hasValidClimatisationState = this.isValidClimatisationState(
			capabilities.climatisation?.climatisationStatus.value.climatisationState,
		);

		if (
			hasValidClimatisationState &&
			!this.volkswagenDevice.hasCapability("climatisation_onoff")
		) {
			await this.volkswagenDevice.addCapability("climatisation_onoff");
		}

		const hasValidTargetTemperature = this.isNumber(
			capabilities.climatisation?.climatisationSettings.value
				.targetTemperature_C,
		);

		if (
			hasValidTargetTemperature &&
			!this.volkswagenDevice.hasCapability("target_temperature")
		) {
			await this.volkswagenDevice.addCapability("target_temperature");
		}

		const hasValidRemainingTime = this.isNumber(
			capabilities.climatisation?.climatisationStatus.value
				.remainingClimatisationTime_min,
		);

		if (
			hasValidRemainingTime &&
			!this.volkswagenDevice.hasCapability(
				"measure_remaining_climatisation_time",
			)
		) {
			await this.volkswagenDevice.addCapability(
				"measure_remaining_climatisation_time",
			);
		}
	}

	public override async setCapabilityValues(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const hasNewerTimestamp = await this.checkTimestamp(
			capabilities.climatisation?.climatisationStatus.value
				.carCapturedTimestamp,
		);

		if (!hasNewerTimestamp) {
			return;
		}

		const climatisationState =
			capabilities.climatisation?.climatisationStatus.value.climatisationState;

		if (
			this.isValidClimatisationState(climatisationState) &&
			this.volkswagenDevice.hasCapability("climatisation_onoff")
		) {
			const isOn = climatisationState !== "off";
			await this.volkswagenDevice.setCapabilityValue(
				"climatisation_onoff",
				isOn,
			);
		}

		const targetTemperature =
			capabilities.climatisation?.climatisationSettings.value
				.targetTemperature_C;

		if (
			this.isNumber(targetTemperature) &&
			this.volkswagenDevice.hasCapability("target_temperature")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"target_temperature",
				targetTemperature,
			);
		}

		const remainingTime =
			capabilities.climatisation?.climatisationStatus.value
				.remainingClimatisationTime_min;

		if (
			this.isNumber(remainingTime) &&
			this.volkswagenDevice.hasCapability(
				"measure_remaining_climatisation_time",
			)
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"measure_remaining_climatisation_time",
				remainingTime,
			);
		}
	}

	public override async registerCapabilityListeners(
		_capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const canClimate = await this.can("climatisation");

		if (!canClimate) {
			return;
		}

		if (this.volkswagenDevice.hasCapability("climatisation_onoff")) {
			this.volkswagenDevice.registerCapabilityListener(
				"climatisation_onoff",
				async (value: boolean) => {
					const vehicle = await this.volkswagenDevice.getVehicle();

					if (value) {
						const currentTargetTemp =
							this.volkswagenDevice.getCapabilityValue("target_temperature");

						const settings: Record<string, unknown> = {};
						if (typeof currentTargetTemp === "number") {
							settings.targetTemperature = currentTargetTemp;
						}

						await vehicle.startClimatisation(settings);
					} else {
						await vehicle.stopClimatisation();
					}

					await this.volkswagenDevice.requestRefresh();
				},
			);
		}

		if (this.volkswagenDevice.hasCapability("target_temperature")) {
			this.volkswagenDevice.registerCapabilityListener(
				"target_temperature",
				async (...args) => {
					const vehicle = await this.volkswagenDevice.getVehicle();

					this.volkswagenDevice.log(JSON.stringify(args));

					// Update climatisation settings
					await vehicle.updateClimatisation({
						targetTemperature: args[0],
						targetTemperatureUnit: "celsius",
					});

					await this.volkswagenDevice.requestRefresh();
				},
			);
		}
	}
}
