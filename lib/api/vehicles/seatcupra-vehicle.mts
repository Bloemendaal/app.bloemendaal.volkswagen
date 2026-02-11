import type { Authenticatable } from "../authenticatable.mjs";
import type { SelectiveStatusCapabilitiesData } from "../capabilities.mjs";
import BaseVehicle, { type VehicleData } from "./base-vehicle.mjs";

export default class SeatCupraVehicle extends BaseVehicle {
  constructor(data: VehicleData, authenticator: Authenticatable) {
    super(data, authenticator);
  }

  public override async getVehicleCapabilities(): Promise<
    Partial<SelectiveStatusCapabilitiesData>
  > {
    const client = await this.authenticator.getClient();
    const userId = this.authenticator.getUserId();
    const result: Partial<SelectiveStatusCapabilitiesData> = {};
    const [statusData, mycarData, chargingData, climatisationData] =
      await Promise.allSettled([
        client
          .get(`/v2/vehicles/${this.vin}/status`)
          .then((r) => r.data)
          .catch((e) => {
            return null;
          }),
        client
          .get(`/v5/users/${userId}/vehicles/${this.vin}/mycar`)
          .then((r) => r.data)
          .catch((e) => {
            return null;
          }),
        client
          .get(`/v1/vehicles/${this.vin}/charging/status`)
          .then((r) => r.data)
          .catch((e) => {
            return null;
          }),
        client
          .get(`/v1/vehicles/${this.vin}/climatisation/status`)
          .then((r) => r.data)
          .catch((e) => {
            return null;
          }),
      ]);

    const timestamp = new Date().toISOString();
    if (statusData.status === "fulfilled" && statusData.value) {
      const status = statusData.value;
      result.access = {
        accessStatus: {
          value: {
            overallStatus: status.locked ? "safe" : "unsafe",
            carCapturedTimestamp: status.updatedAt || timestamp,
            doors: [
              {
                name: "bonnet",
                status: [
                  status.hood?.open === "true" ? "unlocked" : "closed",
                  status.hood?.locked === "true" ? "locked" : "unlocked",
                ],
              },
              {
                name: "trunk",
                status: [
                  status.trunk?.open === "true" ? "unlocked" : "closed",
                  status.trunk?.locked === "true" ? "locked" : "unlocked",
                ],
              },
              {
                name: "frontLeft",
                status: [
                  status.doors?.frontLeft?.open === "true"
                    ? "unlocked"
                    : "closed",
                  status.doors?.frontLeft?.locked === "true"
                    ? "locked"
                    : "unlocked",
                ],
              },
              {
                name: "frontRight",
                status: [
                  status.doors?.frontRight?.open === "true"
                    ? "unlocked"
                    : "closed",
                  status.doors?.frontRight?.locked === "true"
                    ? "locked"
                    : "unlocked",
                ],
              },
              {
                name: "rearLeft",
                status: [
                  status.doors?.rearLeft?.open === "true"
                    ? "unlocked"
                    : "closed",
                  status.doors?.rearLeft?.locked === "true"
                    ? "locked"
                    : "unlocked",
                ],
              },
              {
                name: "rearRight",
                status: [
                  status.doors?.rearRight?.open === "true"
                    ? "unlocked"
                    : "closed",
                  status.doors?.rearRight?.locked === "true"
                    ? "locked"
                    : "unlocked",
                ],
              },
            ],
            windows: [
              {
                name: "frontLeft",
                status: [status.windows?.frontLeft || "closed"],
              },
              {
                name: "frontRight",
                status: [status.windows?.frontRight || "closed"],
              },
              {
                name: "rearLeft",
                status: [status.windows?.rearLeft || "closed"],
              },
              {
                name: "rearRight",
                status: [status.windows?.rearRight || "closed"],
              },
            ],
            doorLockStatus: status.locked ? "locked" : "unlocked",
          },
        },
      };

      result.vehicleLights = {
        lightsStatus: {
          value: {
            carCapturedTimestamp: status.updatedAt || timestamp,
            lights: [
              {
                name: "left",
                status: status.lights === "off" ? "off" : "on",
              },
              {
                name: "right",
                status: status.lights === "off" ? "off" : "on",
              },
            ],
          },
        },
      };
    }

    if (chargingData.status === "fulfilled" && chargingData.value) {
      const charging = chargingData.value;
      result.charging = {
        batteryStatus: {
          value: {
            carCapturedTimestamp: timestamp,
            currentSOC_pct: charging.battery?.currentSocPercentage || 0,
            cruisingRangeElectric_km: charging.battery?.estimatedRangeInKm || 0,
          },
        },
        chargingStatus: {
          value: {
            carCapturedTimestamp: timestamp,
            remainingChargingTimeToComplete_min: 0,
            chargingState: charging.charging?.state || "off",
            chargeMode: charging.charging?.mode || "manual",
            chargePower_kW: 0,
            chargeRate_kmph: 0,
            chargeType: "invalid",
            chargingSettings: "default",
            chargingScenario: "off",
          },
        },
        plugStatus: {
          value: {
            carCapturedTimestamp: timestamp,
            plugConnectionState: charging.plug?.connection || "disconnected",
            plugLockState: charging.plug?.lock || "unlocked",
            externalPower: charging.plug?.externalPower || "unavailable",
            ledColor: "none",
          },
        },
      };
    }

    // Map climatisation data
    if (climatisationData.status === "fulfilled" && climatisationData.value) {
      const climate = climatisationData.value;
      result.climatisation = {
        climatisationStatus: {
          value: {
            carCapturedTimestamp:
              climate.climatisationStatus?.carCapturedTimestamp || timestamp,
            remainingClimatisationTime_min: 0,
            climatisationState:
              climate.climatisationStatus?.climatisationState || "off",
          },
        },
        windowHeatingStatus: {
          value: {
            carCapturedTimestamp:
              climate.windowHeatingStatus?.carCapturedTimestamp || timestamp,
            windowHeatingStatus:
              climate.windowHeatingStatus?.windowHeatingStatus || [],
          },
        },
      };
    }

    // Map fuel status from mycar data
    if (mycarData.status === "fulfilled" && mycarData.value?.engines) {
      const engines = mycarData.value.engines;
      if (engines.primary || engines.secondary) {
        result.fuelStatus = {
          rangeStatus: {
            value: {
              carCapturedTimestamp: timestamp,
              carType: engines.secondary ? "electric" : "gasoline",
              ...(engines.primary && {
                primaryEngine: {
                  type: engines.primary.fuelType || "gasoline",
                  currentSOC_pct: engines.primary.levelPct || 0,
                  remainingRange_km: 0,
                },
              }),
              ...(engines.secondary && {
                secondaryEngine: {
                  type: engines.secondary.fuelType || "electric",
                  currentSOC_pct: engines.secondary.levelPct || 0,
                  remainingRange_km: engines.secondary.rangeKm || 0,
                },
              }),
              totalRange_km:
                (engines.secondary?.rangeKm || 0) +
                (engines.primary?.rangeKm || 0),
            },
          },
        };
      }
    }

    // Add empty structures for required capabilities to prevent errors
    result.measurements = {};
    result.readiness = {};
    result.userCapabilities = {
      capabilitiesStatus: {
        value: [
          {
            id: "access",
            status: [0, 2, 3, 4],
            userDisablingAllowed: false,
          },
          {
            id: "climatisation",
            status: [0, 2, 3, 4],
            userDisablingAllowed: false,
          },
          {
            id: "charging",
            status: [0, 2, 3, 4],
            userDisablingAllowed: false,
          },
          {
            id: "vehicleWakeUpTrigger",
            status: [0, 2, 3, 4],
            userDisablingAllowed: false,
          },
        ],
      },
    };
    return result;
  }

  public override async getParkingPosition(): Promise<any> {
    const client = await this.authenticator.getClient();

    try {
      const response = await client.get(this.getParkingPositionUrl());
      const data = response.data;

      const lat = data.lat || data.latitude || 0;
      const lon = data.lon || data.lng || data.longitude || 0;
      const hasValidCoordinates = lat !== 0 && lon !== 0;

      return {
        parked: hasValidCoordinates,
        lat,
        lon,
        carCapturedTimestamp:
          data.carCapturedTimestamp || new Date().toISOString(),
      };
    } catch (error) {
      return { parked: false };
    }
  }

  protected getSelectiveStatusUrl(): string {
    return "";
  }

  protected getParkingPositionUrl(): string {
    return `/v1/vehicles/${this.vin}/parkingposition`;
  }

  protected getLockUrl(): string {
    return `/v1/vehicles/${this.vin}/access/lock`;
  }

  protected getUnlockUrl(): string {
    return `/v1/vehicles/${this.vin}/access/unlock`;
  }

  protected getStartClimatisationUrl(): string {
    return `/v2/vehicles/${this.vin}/climatisation/start`;
  }

  protected getUpdateClimatisationUrl(): string {
    return `/v2/vehicles/${this.vin}/climatisation/settings`;
  }

  protected getStopClimatisationUrl(): string {
    return `/vehicles/${this.vin}/climatisation/requests/stop`;
  }

  protected getWakeUrl(): string {
    return `/v1/vehicles/${this.vin}/vehicle-wakeup/request`;
  }

  protected getHonkAndFlashUrl(): string {
    return `/v1/vehicles/${this.vin}/honk-and-flash`;
  }

  protected getStartChargingUrl(): string {
    return `/vehicles/${this.vin}/charging/requests/start`;
  }

  protected getStopChargingUrl(): string {
    return `/vehicles/${this.vin}/charging/requests/stop`;
  }

  protected getUpdateChargingSettingsUrl(): string {
    return `/v1/vehicles/${this.vin}/charging/settings`;
  }

  /**
   * SEAT/Cupra uses POST instead of PUT for updating charging settings
   */
  public override async updateChargingSettings(
    settings: any,
    capabilities?: Partial<SelectiveStatusCapabilitiesData>,
  ): Promise<void> {
    const client = await this.authenticator.getClient();

    const payload: Record<string, unknown> = {};
    const isHybrid = this.isHybrid(capabilities);

    if (settings.chargingSettingsAC) {
      const { maxChargeCurrentAC, autoUnlockPlugWhenChargedAC } =
        settings.chargingSettingsAC;

      // For SEAT/Cupra: only use reduced/maximum (lowercase!)
      // "reduced" = 6-8 ampere, "maximum" = normal charging
      if (typeof maxChargeCurrentAC === "number") {
        payload.maxChargeCurrentAc =
          maxChargeCurrentAC >= 16 ? "maximum" : "reduced";
      } else if (maxChargeCurrentAC) {
        payload.maxChargeCurrentAc = maxChargeCurrentAC.toLowerCase();
      }

      // For hybrid vehicles, don't send autoUnlockPlugWhenChargedAc as it's not supported
      if (!isHybrid && autoUnlockPlugWhenChargedAC !== undefined) {
        payload.autoUnlockPlugWhenChargedAc = autoUnlockPlugWhenChargedAC
          ? "on"
          : "off";
      }
    }

    // Note: targetSoc is NOT supported for SEAT/Cupra hybrids
    // Only send it for full BEV vehicles if explicitly different from 100
    // For hybrids, skip targetSoc entirely to avoid API errors
    if (!isHybrid && settings.targetSOC_pct !== undefined) {
      // Only include for non-hybrid vehicles
      payload.targetSoc = settings.targetSOC_pct;
    }

    // Don't send empty payload
    if (Object.keys(payload).length === 0) {
      throw new Error("No charging settings to update");
    }

    await client.post(this.getUpdateChargingSettingsUrl(), payload);
  }

  protected getStartWindowHeatingUrl(): string {
    return `/vehicles/${this.vin}/windowheating/requests/start`;
  }

  protected getStopWindowHeatingUrl(): string {
    return `/vehicles/${this.vin}/windowheating/requests/stop`;
  }

  /**
   * SEAT/Cupra lock implementation uses SecToken header instead of spin in body
   */
  protected async performLock(client: any, sPin: string): Promise<void> {
    // First verify S-PIN to get security token
    const userId = this.authenticator.getUserId();
    const verifyResponse = await client.post(
      `/v2/users/${userId}/spin/verify`,
      { spin: sPin },
    );

    const secToken = verifyResponse.data.securityToken;

    // Use security token in header for lock request
    await client.post(
      this.getLockUrl(),
      {},
      {
        headers: {
          SecToken: secToken,
        },
      },
    );
  }

  /**
   * SEAT/Cupra unlock implementation uses SecToken header instead of spin in body
   */
  protected async performUnlock(client: any, sPin: string): Promise<void> {
    // First verify S-PIN to get security token
    const userId = this.authenticator.getUserId();
    const verifyResponse = await client.post(
      `/v2/users/${userId}/spin/verify`,
      { spin: sPin },
    );

    const secToken = verifyResponse.data.securityToken;
    await client.post(
      this.getUnlockUrl(),
      {},
      {
        headers: {
          SecToken: secToken,
        },
      },
    );
  }
}
