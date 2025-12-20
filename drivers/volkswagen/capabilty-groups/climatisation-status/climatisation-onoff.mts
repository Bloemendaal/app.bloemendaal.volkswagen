import type { StartClimatisationSettings } from "../../api/climatisation.mjs";
import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability, { type Options } from "../capability.mjs";

export default class ClimatisationOnOffCapability extends Capability<boolean> {
	protected getCapabilityName(): string {
		return "climatisation_onoff";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<boolean> => {
		const climatisationState =
			capabilities.climatisation?.climatisationStatus?.value
				?.climatisationState;

		if (!climatisationState || climatisationState === "unsupported") {
			throw new InvalidValueError(climatisationState);
		}

		return climatisationState !== "off";
	};

	public override setter = async (value: boolean): Promise<void> => {
		const vehicle = await this.volkswagenDevice.getVehicle();

		if (value) {
			const currentTargetTemp =
				this.volkswagenDevice.getCapabilityValue("target_temperature");

			const settings: StartClimatisationSettings = {
				targetTemperatureUnit: "celsius",
			};

			if (typeof currentTargetTemp === "number") {
				settings.targetTemperature = currentTargetTemp;
			}

			await vehicle.startClimatisation(settings);
		} else {
			await vehicle.stopClimatisation();
		}

		await this.volkswagenDevice.requestRefresh();
	};

	public override getOptions = async ({
		capabilities,
	}: VehicleData): Promise<Partial<Options>> => {
		const isSetable = await this.can(
			"climatisation",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);

		return isSetable
			? { setable: true, uiComponent: "toggle" }
			: { setable: false, uiComponent: "sensor" };
	};
}
