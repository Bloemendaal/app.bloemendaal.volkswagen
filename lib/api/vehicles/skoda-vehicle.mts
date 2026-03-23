import type { SelectiveStatusCapabilitiesData } from "../capabilities.mjs";
import type {
	ClimatisationSettings,
	StartClimatisationSettings,
} from "../climatisation.mjs";
import type { ParkingPositionData } from "../parking-position.mjs";
import VagVehicle, {
	type ChargingSettings,
	type HonkAndFlashOptions,
} from "./vag-vehicle.mjs";

export default class SkodaVehicle extends VagVehicle {
	public async getVehicleCapabilities(): Promise<
		Partial<SelectiveStatusCapabilitiesData>
	> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async getParkingPosition(): Promise<ParkingPositionData> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async lock(): Promise<void> {
		const configuration = this.authenticator.getConfiguration();

		if (!configuration.sPin) {
			throw new Error("S-PIN is required to lock the vehicle");
		}

		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async unlock(): Promise<void> {
		const configuration = this.authenticator.getConfiguration();

		if (!configuration.sPin) {
			throw new Error("S-PIN is required to unlock the vehicle");
		}

		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async startClimatisation(
		_settings: StartClimatisationSettings = {},
	): Promise<void> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async updateClimatisation(
		_settings: ClimatisationSettings = {},
	): Promise<void> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async stopClimatisation(): Promise<void> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async wake(): Promise<void> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async honkAndFlash(_options: HonkAndFlashOptions): Promise<void> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async startCharging(): Promise<void> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async stopCharging(): Promise<void> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async updateChargingSettings(
		_settings: ChargingSettings,
	): Promise<void> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async startWindowHeating(): Promise<void> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}

	public async stopWindowHeating(): Promise<void> {
		throw new Error(
			"Vehicle capabilities are not yet implemented for Skoda vehicles",
		);
	}
}
