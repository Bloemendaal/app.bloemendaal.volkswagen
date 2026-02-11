import Flow from "./flow.mjs";

export default class TimestampUpdatedFlow extends Flow {
	public override async register(): Promise<void> {
		if (!this.baseDevice.hasCapability("timestamp")) {
			await this.baseDevice.addCapability("timestamp");
		}
	}

	public override async run(): Promise<void> {
		const card =
			this.baseDevice.homey.flow.getDeviceTriggerCard("timestamp_updated");

		let shouldTrigger = false;
		let latestTimestamp = +this.baseDevice.getCapabilityValue("timestamp");

		for (const capability of this.baseDevice.getCapabilities()) {
			if (!capability.startsWith("timestamp.")) {
				continue;
			}

			const currentValue = +this.baseDevice.getCapabilityValue(capability);

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

		await this.baseDevice.setCapabilityValue("timestamp", latestTimestamp);

		await card.trigger(this.baseDevice, { timestamp: latestTimestamp });
	}
}
