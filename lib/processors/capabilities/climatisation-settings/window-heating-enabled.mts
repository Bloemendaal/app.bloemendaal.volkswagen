import type { FetchData } from "../../../api/fetch.mjs";
import InvalidValueError from "../../../errors/invalid-value-error.mjs";
import Capability from "../capability.mjs";

export default class WindowHeatingEnabledCapability extends Capability<boolean> {
	protected getCapabilityName(): string {
		return "window_heating_enabled";
	}

	public override async getter({ capabilities }: FetchData): Promise<boolean> {
		const windowHeatingEnabled =
			capabilities.climatisation?.climatisationSettings?.value
				?.windowHeatingEnabled;

		if (typeof windowHeatingEnabled !== "boolean") {
			throw new InvalidValueError(windowHeatingEnabled);
		}

		return windowHeatingEnabled;
	}

	public override async setter({ capabilities }: FetchData): Promise<void> {
		const name = this.getCapabilityName();

		const isSetable = await this.can(
			"climatisation",
			capabilities.userCapabilities?.capabilitiesStatus?.value,
		);

		this.device.setCapabilityOptions(
			name,
			isSetable
				? { setable: true, uiComponent: "toggle" }
				: { setable: false, uiComponent: "sensor" },
		);

		if (!isSetable) {
			return;
		}

		this.device.registerCapabilityListener(name, async (value: boolean) => {
			const vehicle = await this.device.getVehicle();

			if (value) {
				await vehicle.startWindowHeating();
			} else {
				await vehicle.stopWindowHeating();
			}

			await this.device.requestRefresh();
		});
	}
}
