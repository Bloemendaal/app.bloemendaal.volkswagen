import Flow from "./flow.mjs";

export default class TimestampUpdatedFlow extends Flow {
	public override async register(): Promise<void> {
		if (!this.device.hasCapability("timestamp")) {
			await this.device.addCapability("timestamp");
		}
	}

	public override async run(): Promise<void> {
		const card =
			this.device.homey.flow.getDeviceTriggerCard("timestamp_updated");

		let shouldTrigger = false;
		let latestTimestamp = +this.device.getCapabilityValue("timestamp");

		for (const capability of this.device.getCapabilities()) {
			if (!capability.startsWith("timestamp.")) {
				continue;
			}

			const currentValue = +this.device.getCapabilityValue(capability);

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

		await this.device.setCapabilityValue("timestamp", latestTimestamp);

		await card.trigger(this.device, { timestamp: latestTimestamp });
	}
}
