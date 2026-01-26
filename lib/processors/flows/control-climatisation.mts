import Flow from "./flow.mjs";

export default class ControlClimatisationFlow extends Flow {
  public override async register(): Promise<void> {
    const onCard = this.baseDevice.homey.flow.getActionCard(
      "climatisation_onoff_on"
    );
    const offCard = this.baseDevice.homey.flow.getActionCard(
      "climatisation_onoff_off"
    );

    onCard.registerRunListener(this.handleOn.bind(this));
    offCard.registerRunListener(this.handleOff.bind(this));
  }

  private async handleOn(args: { temperature?: number }): Promise<void> {
    const vehicle = await this.baseDevice.getVehicle();

    await vehicle
      .startClimatisation({
        targetTemperature: args.temperature,
        targetTemperatureUnit: "celsius",
      })
      .catch((e: Error) => this.baseDevice.errorAndThrow(e));

    await this.baseDevice.requestRefresh(500, 1000);
  }

  private async handleOff(): Promise<void> {
    const vehicle = await this.baseDevice
      .getVehicle()
      .catch((e: Error) => this.baseDevice.errorAndThrow(e));

    await vehicle
      .stopClimatisation()
      .catch((e: Error) => this.baseDevice.errorAndThrow(e));

    await this.baseDevice.requestRefresh(500, 1000);
  }
}
