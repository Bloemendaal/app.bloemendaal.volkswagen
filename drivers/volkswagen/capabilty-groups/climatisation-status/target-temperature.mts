import type { VehicleData } from "../../device.mjs";
import InvalidValueError from "../../errors/invalid-value-error.mjs";
import Capability, { type CapabilityOptions } from "../capability.mjs";

export default class TargetTemperatureCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "target_temperature";
	}

	public override getter = async ({
		capabilities,
	}: VehicleData): Promise<number> => {
		const targetTemperature =
			capabilities.climatisation?.climatisationSettings?.value
				?.targetTemperature_C;

		if (!this.isNumber(targetTemperature)) {
			throw new InvalidValueError(targetTemperature);
		}

		return targetTemperature;
	};

	public override setter = async (value: number): Promise<void> => {
		const vehicle = await this.volkswagenDevice.getVehicle();

		await vehicle.updateClimatisation({
			targetTemperature: value,
			targetTemperatureUnit: "celsius",
		});

		await this.volkswagenDevice.requestRefresh();
	};

	public override getOptions = async ({
		capabilities,
	}: VehicleData): Promise<Partial<CapabilityOptions>> => {
		const isSetable = await this.can(
			"climatisation",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);

		return isSetable
			? { setable: true, uiComponent: "thermostat" }
			: { setable: false, uiComponent: "sensor" };
	};
}
