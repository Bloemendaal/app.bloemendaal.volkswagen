import Capability, { type VehicleData } from "./capability.mjs";

export default class PlugStatus extends Capability {
	private isValidPlugConnectionState(
		value: string | null = null,
	): value is string {
		return Boolean(value) && value !== "unsupported";
	}

	protected override getCapabilityName(): string {
		return "plug_status";
	}

	public override async addCapabilities({
		capabilities,
	}: VehicleData): Promise<void> {
		await this.addTimestampCapability(
			capabilities.charging?.plugStatus.value.carCapturedTimestamp,
		);

		const hasValidPlugConnectionState = this.isValidPlugConnectionState(
			capabilities.charging?.plugStatus.value.plugConnectionState,
		);

		if (
			hasValidPlugConnectionState &&
			!this.volkswagenDevice.hasCapability("is_plug_connected")
		) {
			await this.volkswagenDevice.addCapability("is_plug_connected");
		}
	}

	public override async setCapabilityValues({
		capabilities,
	}: VehicleData): Promise<void> {
		const hasNewerTimestamp = await this.checkTimestamp(
			capabilities.charging?.plugStatus.value.carCapturedTimestamp,
		);

		if (!hasNewerTimestamp) {
			return;
		}

		const plugConnectionState =
			capabilities.charging?.plugStatus.value.plugConnectionState;

		if (
			this.isValidPlugConnectionState(plugConnectionState) &&
			this.volkswagenDevice.hasCapability("is_plug_connected")
		) {
			await this.volkswagenDevice.setCapabilityValue(
				"is_plug_connected",
				plugConnectionState === "connected",
			);
		}
	}
}
