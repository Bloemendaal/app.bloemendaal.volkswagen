import type VagDevice from "#lib/drivers/vag-device.mjs";
import Flow from "./flow.mjs";

export default class TimestampUpdatedFlow extends Flow {
	public override async register(): Promise<void> {}

	public override async run(device: VagDevice): Promise<void> {
		if (!device.hasCapability("timestamp")) {
			await device.addCapability("timestamp");
		}

		const card = device.homey.flow.getDeviceTriggerCard("timestamp_updated");

		let shouldTrigger = false;
		let latestTimestamp = +device.getCapabilityValue("timestamp");

		for (const capability of device.getCapabilities()) {
			if (!capability.startsWith("timestamp.")) {
				continue;
			}

			const currentValue = +device.getCapabilityValue(capability);

			if (!currentValue) {
				continue;
			}

			if (currentValue > latestTimestamp) {
				latestTimestamp = currentValue;
				shouldTrigger = true;
			}
		}

		if (!shouldTrigger) {
			return;
		}

		await device.setCapabilityValue("timestamp", latestTimestamp);

		await card.trigger(device, { timestamp: latestTimestamp });
	}
}
