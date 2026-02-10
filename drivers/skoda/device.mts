import type { Authenticatable } from "#lib/api/authenticatable.mjs";
import VagDevice from "#lib/drivers/vag-device.mjs";
import AccessStatusCapabilityGroup from "#lib/processors/capabilities/access-status/index.mjs";
import BatteryStatusCapabilityGroup from "#lib/processors/capabilities/battery-status/index.mjs";
import ChargingSettingsCapabilityGroup from "#lib/processors/capabilities/charging-settings/index.mjs";
import ChargingStatusCapabilityGroup from "#lib/processors/capabilities/charging-status/index.mjs";
import ClimatisationStatusCapabilityGroup from "#lib/processors/capabilities/climatisation-status/index.mjs";
import MaintenanceStatusCapabilityGroup from "#lib/processors/capabilities/maintenance-status/index.mjs";
import OdometerStatusCapabilityGroup from "#lib/processors/capabilities/odometer-status/index.mjs";
import ParkingPositionCapabilityGroup from "#lib/processors/capabilities/parking-position/index.mjs";
import PlugStatusCapabilityGroup from "#lib/processors/capabilities/plug-status/index.mjs";
import ReadinessStatusCapabilityGroup from "#lib/processors/capabilities/readiness-status/index.mjs";
import TemperatureBatteryStatusCapabilityGroup from "#lib/processors/capabilities/temperature-battery-status/index.mjs";
import UserCapabilitiesCapabilityGroup from "#lib/processors/capabilities/user-capabilities/index.mjs";
import ControlChargingFlow from "#lib/processors/flows/control-charging.mjs";
import ControlClimatisationFlow from "#lib/processors/flows/control-climatisation.mjs";
import UpdateChargingSettingsFlow from "#lib/processors/flows/update-charge-settings.mjs";
import Processor from "#lib/processors/processable.mjs";
import EnergySetting from "#lib/processors/settings/energy.mjs";
import SkodaAuthenticator from "./authenticator.mjs";

export default class SkodaDevice extends VagDevice {
	protected readonly processor: Processor = new Processor([
		new EnergySetting(this),
		new AccessStatusCapabilityGroup(this),
		new BatteryStatusCapabilityGroup(this),
		new ChargingSettingsCapabilityGroup(this),
		new ChargingStatusCapabilityGroup(this),
		new ClimatisationStatusCapabilityGroup(this),
		new MaintenanceStatusCapabilityGroup(this),
		new OdometerStatusCapabilityGroup(this),
		new ParkingPositionCapabilityGroup(this),
		new PlugStatusCapabilityGroup(this),
		new ReadinessStatusCapabilityGroup(this),
		new TemperatureBatteryStatusCapabilityGroup(this),
		new UserCapabilitiesCapabilityGroup(this),
		new ControlChargingFlow(this),
		new ControlClimatisationFlow(this),
		new UpdateChargingSettingsFlow(this),
	]);

	protected getAuthenticator(): Authenticatable {
		return SkodaAuthenticator.fromSettings(this.getSettings());
	}
}
