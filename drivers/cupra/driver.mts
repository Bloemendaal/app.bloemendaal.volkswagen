import Homey from "homey";
import type { PairSession } from "homey/lib/Driver.js";
import CupraAuthenticator from "./authenticator.mjs";
import SeatCupraUser from "../../lib/api/users/seatcupra-user.mjs";

export default class CupraDriver extends Homey.Driver {
  public async onPair(session: PairSession): Promise<void> {
    let sPin = "";
    let email = "";
    let password = "";

    let user: SeatCupraUser | null = null;

    session.setHandler(
      "login",
      async (data: {
        username: string;
        password: string;
      }): Promise<boolean> => {
        email = data.username;
        password = data.password;

        const authenticator = new CupraAuthenticator({
          credentials: { email, password },
        });
        user = new SeatCupraUser(authenticator);

        return await user.canLogin(this.homey);
      }
    );

    session.setHandler(
      "pincode",
      async (pincode: string[]): Promise<boolean> => {
        sPin = pincode.join("");

        const authenticator = new CupraAuthenticator({
          sPin,
          credentials: { email, password },
        });
        const userInstance = user ?? new SeatCupraUser(authenticator);

        userInstance.getAuthenticator().setSPin(sPin);

        // Authenticate to get the token, then extract userId
        await authenticator.getClient();
        const userId = authenticator.getUserId();
        if (!userId) {
          throw new Error("Failed to get user ID from authentication token");
        }

        return await userInstance.verifySPin(userId);
      }
    );

    session.setHandler("list_devices", async () => {
      const authenticator = new CupraAuthenticator({
        sPin,
        credentials: { email, password },
      });
      const userInstance = user ?? new SeatCupraUser(authenticator);

      userInstance.getAuthenticator().setSPin(sPin);

      const vehicles = await userInstance.getVehicles();
      const settings = await userInstance.getSettings();

      const devices = vehicles.map((vehicle) => ({
        settings,
        name: vehicle.nickname,
        data: {
          id: vehicle.vin,
        },
      }));

      return devices;
    });
  }
}
