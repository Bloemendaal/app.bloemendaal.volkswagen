import VolkswagenUser from "#lib/api/users/volkswagen-user.mjs";
import type VolkswagenVehicle from "#lib/api/vehicles/volkswagen-vehicle.mjs";
import VagDevice from "#lib/drivers/vag-device.mjs";
import AccessStatusCapabilityGroup from "#lib/processors/capabilities/access-status/index.mjs";
import BatteryStatusCapabilityGroup from "#lib/processors/capabilities/battery-status/index.mjs";
import ChargingSettingsCapabilityGroup from "#lib/processors/capabilities/charging-settings/index.mjs";
import ChargingStatusCapabilityGroup from "#lib/processors/capabilities/charging-status/index.mjs";
import ClimatisationSettingsCapabilityGroup from "#lib/processors/capabilities/climatisation-settings/index.mjs";
import ClimatisationStatusCapabilityGroup from "#lib/processors/capabilities/climatisation-status/index.mjs";
import FuelLevelStatusCapabilityGroup from "#lib/processors/capabilities/fuel-level-status/index.mjs";
import MaintenanceStatusCapabilityGroup from "#lib/processors/capabilities/maintenance-status/index.mjs";
import OdometerStatusCapabilityGroup from "#lib/processors/capabilities/odometer-status/index.mjs";
import ParkingPositionCapabilityGroup from "#lib/processors/capabilities/parking-position/index.mjs";
import PlugStatusCapabilityGroup from "#lib/processors/capabilities/plug-status/index.mjs";
import RangeStatusCapabilityGroup from "#lib/processors/capabilities/range-status/index.mjs";
import ReadinessStatusCapabilityGroup from "#lib/processors/capabilities/readiness-status/index.mjs";
import TemperatureBatteryStatusCapabilityGroup from "#lib/processors/capabilities/temperature-battery-status/index.mjs";
import UserCapabilitiesCapabilityGroup from "#lib/processors/capabilities/user-capabilities/index.mjs";
import ControlChargingFlow from "#lib/processors/flows/control-charging.mjs";
import ControlClimatisationFlow from "#lib/processors/flows/control-climatisation.mjs";
import TimestampUpdatedFlow from "#lib/processors/flows/timestamp-updated.mjs";
import UpdateChargingSettingsFlow from "#lib/processors/flows/update-charge-settings.mjs";
import UpdateChargingSettingsHybridFlow from "#lib/processors/flows/update-charge-settings-hybrid.mjs";
import UpdatePollingIntervalFlow from "#lib/processors/flows/update-polling-interval.mjs";
import Processor from "#lib/processors/processable.mjs";
import EnergySetting from "#lib/processors/settings/energy.mjs";
import VolkswagenAuthenticator from "./authenticator.mjs";

export default class VolkswagenDevice extends VagDevice<VolkswagenVehicle> {
	protected readonly processor: Processor = new Processor([
		new EnergySetting(this),
		new AccessStatusCapabilityGroup(this),
		new BatteryStatusCapabilityGroup(this),
		new ChargingSettingsCapabilityGroup(this),
		new ChargingStatusCapabilityGroup(this),
		new ClimatisationSettingsCapabilityGroup(this),
		new ClimatisationStatusCapabilityGroup(this),
		new FuelLevelStatusCapabilityGroup(this),
		new MaintenanceStatusCapabilityGroup(this),
		new OdometerStatusCapabilityGroup(this),
		new ParkingPositionCapabilityGroup(this),
		new PlugStatusCapabilityGroup(this),
		new RangeStatusCapabilityGroup(this),
		new ReadinessStatusCapabilityGroup(this),
		new TemperatureBatteryStatusCapabilityGroup(this),
		new UserCapabilitiesCapabilityGroup(this),
		new ControlChargingFlow(this),
		new ControlClimatisationFlow(this),
		new TimestampUpdatedFlow(this),
		new UpdatePollingIntervalFlow(this),
		new UpdateChargingSettingsFlow(this),
		new UpdateChargingSettingsHybridFlow(this),
	]);

	protected createUser(): VolkswagenUser {
		return new VolkswagenUser(
			VolkswagenAuthenticator.fromSettings(this.getSettings()),
		);
	}
}
