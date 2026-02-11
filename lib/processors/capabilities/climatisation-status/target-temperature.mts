import type { FetchData } from "#lib/api/fetch.mjs";
import InvalidValueError from "#lib/errors/invalid-value-error.mjs";
import Capability from "#lib/processors/capabilities/capability.mjs";

export default class TargetTemperatureCapability extends Capability<number> {
	protected getCapabilityName(): string {
		return "target_temperature";
	}

	public override async getter({ capabilities }: FetchData): Promise<number> {
		const targetTemperature =
			capabilities.climatisation?.climatisationSettings?.value
				?.targetTemperature_C;

		if (!this.isNumber(targetTemperature)) {
			throw new InvalidValueError(targetTemperature);
		}

		return targetTemperature;
	}

	public override async setter({ capabilities }: FetchData): Promise<void> {
		const name = this.getCapabilityName();

		const isSetable = await this.can(
			"climatisation",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);

		await this.baseDevice.setCapabilityOptions(
			name,
			isSetable
				? { setable: true, uiComponent: "thermostat" }
				: { setable: false, uiComponent: "sensor" },
		);

		if (!isSetable) {
			return;
		}

		this.baseDevice.registerCapabilityListener(name, async (value: number) => {
			const vehicle = await this.baseDevice.getVehicle();

			await vehicle.updateClimatisation({
				targetTemperature: value,
				targetTemperatureUnit: "celsius",
			});

			await this.baseDevice.requestRefresh();
		});
	}
}
