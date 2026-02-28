import Homey from "homey";
import type { PairSession } from "homey/lib/Driver.js";
import SeatAuthenticator from "#lib/api/authenticators/seat-authenticator.mjs";
import SeatCupraUser from "#lib/api/users/seatcupra-user.mjs";

export default class SeatDriver extends Homey.Driver {
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

				const authenticator = new SeatAuthenticator({
					credentials: { email, password },
				});
				user = new SeatCupraUser(authenticator);

				return await user.canLogin(this.homey);
			},
		);

		session.setHandler(
			"pincode",
			async (pincode: string[]): Promise<boolean> => {
				sPin = pincode.join("");

				const authenticator = new SeatAuthenticator({
					sPin,
					credentials: { email, password },
				});
				const userInstance = user ?? new SeatCupraUser(authenticator);

				userInstance.authenticator.setSPin(sPin);

				return await userInstance.verifySPin();
			},
		);

		session.setHandler("list_devices", async () => {
			const authenticator = new SeatAuthenticator({
				sPin,
				credentials: { email, password },
			});
			const userInstance = user ?? new SeatCupraUser(authenticator);

			userInstance.authenticator.setSPin(sPin);

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
