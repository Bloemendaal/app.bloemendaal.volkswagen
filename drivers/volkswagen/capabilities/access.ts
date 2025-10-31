import type { CapabilitiesStatusData } from "../api/capabilities/user-capabilities.js";
import type { SelectiveStatusCapabilitiesData } from "../api/capabilities.js";
import Capability from "./capability.js";

export default class Access extends Capability {
	protected override getCapabilityName(): string {
		return "access";
	}

	public override async addCapabilities(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const timestamp = this.addTimestampCapability(
			capabilities.access?.accessStatus.value.carCapturedTimestamp,
		);

		const locked = this.addLockedCapability(capabilities);
		const generalAlarm = this.addGeneralAlarmCapability(capabilities);

		const doorAlarms = this.addAlarmCapabilities(
			"alarm_door",
			capabilities.access?.accessStatus.value.doors ?? [],
		);

		const windowAlarms = this.addAlarmCapabilities(
			"alarm_window",
			capabilities.access?.accessStatus.value.windows ?? [],
		);

		await Promise.all([
			timestamp,
			locked,
			generalAlarm,
			doorAlarms,
			windowAlarms,
		]);
	}

	private async addLockedCapability(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const lockedStatus = capabilities.access?.accessStatus.value.doorLockStatus;

		if (lockedStatus !== "locked" && lockedStatus !== "unlocked") {
			return;
		}

		if (!this.volkswagenDevice.hasCapability("locked")) {
			await this.volkswagenDevice.addCapability("locked");
		}

		const isSetable = await this.isLockedSetable(
			capabilities.userCapabilities?.capabilitiesStatus.value,
		);

		await this.volkswagenDevice.setCapabilityOptions(
			"locked",
			isSetable
				? { setable: true, uiComponent: "toggle" }
				: { setable: false, uiComponent: "sensor" },
		);
	}

	private async addGeneralAlarmCapability(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const lockedStatus = capabilities.access?.accessStatus.value.overallStatus;

		if (lockedStatus !== "safe" && lockedStatus !== "unsafe") {
			return;
		}

		if (!this.volkswagenDevice.hasCapability("alarm_general")) {
			await this.volkswagenDevice.addCapability("alarm_general");
		}
	}

	private async addAlarmCapabilities(
		capability: string,
		lockables: { name: string; status: string[] }[],
	): Promise<void> {
		for (const lockable of lockables) {
			if (lockable.status.includes("unsupported")) {
				continue;
			}

			const capabilityId = `${capability}.${lockable.name}`;

			if (this.volkswagenDevice.hasCapability(capabilityId)) {
				continue;
			}

			await this.volkswagenDevice.addCapability(capabilityId);

			await this.volkswagenDevice.setCapabilityOptions(capabilityId, {
				title: this.volkswagenDevice.homey.__(
					`capabilities.${capability}.title`,
					{
						name: this.volkswagenDevice.homey.__(
							`capabilities.${capability}.variables.${lockable.name}`,
						),
					},
				),
			});
		}
	}

	private async isLockedSetable(
		capabilities: CapabilitiesStatusData[] = [],
	): Promise<boolean> {
		const callback = ({ id }: CapabilitiesStatusData) => id === "access";

		if (capabilities.some(callback)) {
			return true;
		}

		const vehicle = await this.volkswagenDevice.getVehicle();

		return vehicle.capabilities.some(callback);
	}

	public override async setCapabilityValues(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		const hasNewerTimestamp = await this.checkTimestamp(
			capabilities.access?.accessStatus.value.carCapturedTimestamp,
		);

		if (!hasNewerTimestamp) {
			return;
		}

		if (this.volkswagenDevice.hasCapability("locked")) {
			const lockedStatus =
				capabilities.access?.accessStatus.value.doorLockStatus;

			await this.volkswagenDevice.setCapabilityValue(
				"locked",
				lockedStatus === "locked",
			);
		}

		if (this.volkswagenDevice.hasCapability("alarm_general")) {
			const overallStatus =
				capabilities.access?.accessStatus.value.overallStatus;

			await this.volkswagenDevice.setCapabilityValue(
				"alarm_general",
				overallStatus !== "safe",
			);
		}

		const doors = capabilities.access?.accessStatus.value.doors ?? [];

		for (const door of doors) {
			const capabilityId = `alarm_door.${door.name}`;

			if (!this.volkswagenDevice.hasCapability(capabilityId)) {
				continue;
			}

			await this.volkswagenDevice.setCapabilityValue(
				capabilityId,
				door.status.includes("unlocked"),
			);
		}

		const windows = capabilities.access?.accessStatus.value.windows ?? [];

		for (const window of windows) {
			const capabilityId = `alarm_window.${window.name}`;

			if (!this.volkswagenDevice.hasCapability(capabilityId)) {
				continue;
			}

			await this.volkswagenDevice.setCapabilityValue(
				capabilityId,
				!window.status.includes("closed"),
			);
		}
	}

	public override async registerCapabilityListeners(
		capabilities: Partial<SelectiveStatusCapabilitiesData>,
	): Promise<void> {
		if (!this.volkswagenDevice.hasCapability("locked")) {
			return;
		}

		const isSetable = await this.isLockedSetable(
			capabilities.userCapabilities?.capabilitiesStatus.value,
		);

		if (!isSetable) {
			return;
		}

		this.volkswagenDevice.registerCapabilityListener(
			"locked",
			async (value: boolean) => {
				const vehicle = await this.volkswagenDevice.getVehicle();
				await vehicle.lockOrUnlock(value);
			},
		);
	}
}
