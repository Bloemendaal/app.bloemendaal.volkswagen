import type { Authenticatable } from "../authenticatable.mjs";
import type { CapabilitiesStatusData } from "../capabilities/user-capabilities.mjs";
import {
  type SelectiveStatusCapabilitiesData,
  selectiveStatusCapabilities,
} from "../capabilities.mjs";

// Re-export commonly used types and constants
export { selectiveStatusCapabilities };
export type { SelectiveStatusCapabilitiesData };
import type {
  ClimatisationSettings,
  StartClimatisationSettings,
} from "../climatisation.mjs";
import type { ParkingPositionData } from "../parking-position.mjs";

export interface VehicleData {
  vin: string;
  role: string;
  userRoleStatus: string;
  enrollmentStatus: string;
  brandCode: string;
  model: string;
  nickname: string;
  capabilities: CapabilitiesStatusData[];
  images: VehicleImagesData;
  coUsers: CoUserData[];
  devicePlatform: string;
  tags: TagData[];
}

// Not sure yet what's inside these types
export type VehicleImagesData = object;
export type CoUserData = unknown;
export type TagData = unknown;

export interface ChargingSettingsAC {
  maxChargeCurrentAC: number | "reduced" | "maximum";
  autoUnlockPlugWhenChargedAC?: boolean | undefined;
}

export interface ChargingSettings {
  targetSOC_pct?: number;
  chargingSettingsAC?: ChargingSettingsAC;
}

/**
 * Base class for all VAG Group vehicles
 * Provides common functionality with brand-specific endpoint implementations
 */
export default abstract class BaseVehicle implements VehicleData {
  protected readonly authenticator: Authenticatable;

  public readonly vin: string;
  public readonly role: string;
  public readonly userRoleStatus: string;
  public readonly enrollmentStatus: string;
  public readonly brandCode: string;
  public readonly model: string;
  public readonly nickname: string;
  public readonly capabilities: CapabilitiesStatusData[];
  public readonly images: VehicleImagesData;
  public readonly coUsers: CoUserData[];
  public readonly devicePlatform: string;
  public readonly tags: TagData[];

  constructor(data: VehicleData, authenticator: Authenticatable) {
    this.authenticator = authenticator;

    this.vin = data.vin;
    this.role = data.role;
    this.userRoleStatus = data.userRoleStatus;
    this.enrollmentStatus = data.enrollmentStatus;
    this.brandCode = data.brandCode;
    this.model = data.model;
    this.nickname = data.nickname;
    this.capabilities = data.capabilities;
    this.images = data.images;
    this.coUsers = data.coUsers;
    this.devicePlatform = data.devicePlatform;
    this.tags = data.tags;
  }

  // Abstract methods for brand-specific endpoint URLs
  protected abstract getSelectiveStatusUrl(): string;
  protected abstract getParkingPositionUrl(): string;
  protected abstract getLockUrl(): string;
  protected abstract getUnlockUrl(): string;
  protected abstract getStartClimatisationUrl(): string;
  protected abstract getUpdateClimatisationUrl(): string;
  protected abstract getStopClimatisationUrl(): string;
  protected abstract getWakeUrl(): string;
  protected abstract getHonkAndFlashUrl(): string;
  protected abstract getStartChargingUrl(): string;
  protected abstract getStopChargingUrl(): string;
  protected abstract getUpdateChargingSettingsUrl(): string;
  protected abstract getStartWindowHeatingUrl(): string;
  protected abstract getStopWindowHeatingUrl(): string;

  public getAuthenticator(): Authenticatable {
    return this.authenticator;
  }

  /**
   * Check if this vehicle is a hybrid (has both primary and secondary engine)
   * This requires checking the last fetched capabilities data
   */
  public isHybrid(
    capabilities?: Partial<SelectiveStatusCapabilitiesData>,
  ): boolean {
    if (!capabilities) return false;
    const rangeStatus = capabilities.fuelStatus?.rangeStatus?.value;
    return !!(rangeStatus?.primaryEngine && rangeStatus?.secondaryEngine);
  }

  public async getVehicleCapabilities(): Promise<
    Partial<SelectiveStatusCapabilitiesData>
  > {
    const client = await this.authenticator.getClient();

    const response = await client.get<Partial<SelectiveStatusCapabilitiesData>>(
      this.getSelectiveStatusUrl(),
    );

    return response.data;
  }

  public async getParkingPosition(): Promise<ParkingPositionData> {
    const client = await this.authenticator.getClient();

    const response = await client.get<{ data: ParkingPositionData }>(
      this.getParkingPositionUrl(),
    );

    return response.data.data;
  }

  public async lock(): Promise<void> {
    const configuration = this.authenticator.getConfiguration();

    if (!configuration.sPin) {
      throw new Error("S-PIN is required to lock the vehicle");
    }

    const client = await this.authenticator.getClient();

    await this.performLock(client, configuration.sPin);
  }

  public async unlock(): Promise<void> {
    const configuration = this.authenticator.getConfiguration();

    if (!configuration.sPin) {
      throw new Error("S-PIN is required to unlock the vehicle");
    }

    const client = await this.authenticator.getClient();

    await this.performUnlock(client, configuration.sPin);
  }

  // Abstract methods for lock/unlock implementation (different for SEAT/Cupra)
  protected abstract performLock(client: any, sPin: string): Promise<void>;
  protected abstract performUnlock(client: any, sPin: string): Promise<void>;

  public lockOrUnlock(lock: boolean): Promise<void> {
    return lock ? this.lock() : this.unlock();
  }

  public async startClimatisation(
    settings: StartClimatisationSettings = {},
  ): Promise<void> {
    if (typeof settings.targetTemperature === "number") {
      settings.targetTemperature =
        Math.round(settings.targetTemperature / 0.5) * 0.5;
    }

    const client = await this.authenticator.getClient();

    await client.post(this.getStartClimatisationUrl(), settings);
  }

  public async updateClimatisation(
    settings: ClimatisationSettings = {},
  ): Promise<void> {
    if (typeof settings.targetTemperature === "number") {
      settings.targetTemperature =
        Math.round(settings.targetTemperature / 0.5) * 0.5;
    }

    const client = await this.authenticator.getClient();

    await client.put(this.getUpdateClimatisationUrl(), settings);
  }

  public async stopClimatisation(): Promise<void> {
    const client = await this.authenticator.getClient();

    await client.post(this.getStopClimatisationUrl());
  }

  public async wake(): Promise<void> {
    const client = await this.authenticator.getClient();

    await client.post(this.getWakeUrl());
  }

  public async honkAndFlash(options: {
    mode: "flash" | "honk-and-flash";
    duration: number;
    userPosition: {
      latitude: number;
      longitude: number;
    };
  }): Promise<void> {
    const client = await this.authenticator.getClient();

    await client.post(this.getHonkAndFlashUrl(), {
      mode: options.mode,
      duration_s: options.duration,
      userPosition: options.userPosition,
    });
  }

  public async startCharging(): Promise<void> {
    const client = await this.authenticator.getClient();

    await client.post(this.getStartChargingUrl());
  }

  public async stopCharging(): Promise<void> {
    const client = await this.authenticator.getClient();

    await client.post(this.getStopChargingUrl());
  }

  public async updateChargingSettings(
    settings: ChargingSettings,
    capabilities?: Partial<SelectiveStatusCapabilitiesData>,
  ): Promise<void> {
    const client = await this.authenticator.getClient();

    const payload: Record<string, unknown> = {};

    if (settings.chargingSettingsAC) {
      const { maxChargeCurrentAC, autoUnlockPlugWhenChargedAC } =
        settings.chargingSettingsAC;

      if (typeof maxChargeCurrentAC === "number") {
        const [amperage] = [5, 10, 13, 32].sort(
          (a, b) =>
            Math.abs(a - maxChargeCurrentAC) - Math.abs(b - maxChargeCurrentAC),
        );

        payload.maxChargeCurrentAC_A = amperage;
      } else {
        payload.maxChargeCurrentAC = maxChargeCurrentAC;
      }

      payload.autoUnlockPlugWhenChargedAC = autoUnlockPlugWhenChargedAC
        ? "on"
        : "off";
    }

    if (typeof settings.targetSOC_pct === "number") {
      payload.targetSOC_pct = Math.round(
        Math.min(Math.max(settings.targetSOC_pct, 50), 100),
      );
    }

    await client.put(this.getUpdateChargingSettingsUrl(), payload);
  }

  public async startWindowHeating(): Promise<void> {
    const client = await this.authenticator.getClient();

    await client.post(this.getStartWindowHeatingUrl());
  }

  public async stopWindowHeating(): Promise<void> {
    const client = await this.authenticator.getClient();

    await client.post(this.getStopWindowHeatingUrl());
  }
}
