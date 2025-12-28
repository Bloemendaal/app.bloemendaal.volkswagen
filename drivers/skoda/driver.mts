import Homey from "homey";
import type { PairSession } from "homey/lib/Driver.js";
import User from "../../lib/api/user.mjs";
import SkodaAuthenticator from "./authenticator.mjs";

export default class SkodaDriver extends Homey.Driver {
	public async onPair(session: PairSession): Promise<void> {
		let sPin = "";
		let email = "";
		let password = "";

		let user: User | null = null;

		session.setHandler(
			"login",
			async (data: {
				username: string;
				password: string;
			}): Promise<boolean> => {
				email = data.username;
				password = data.password;

				const authenticator = new SkodaAuthenticator({
					credentials: { email, password },
				});
				user = new User(authenticator);

				return await user.canLogin(this.homey);
			},
		);

		session.setHandler(
			"pincode",
			async (pincode: string[]): Promise<boolean> => {
				sPin = pincode.join("");

				const authenticator = new SkodaAuthenticator({
					sPin,
					credentials: { email, password },
				});
				const userInstance = user ?? new User(authenticator);

				userInstance.getAuthenticator().setSPin(sPin);

				return await userInstance.verifySPin();
			},
		);

		session.setHandler("list_devices", async () => {
			const authenticator = new SkodaAuthenticator({
				sPin,
				credentials: { email, password },
			});
			const userInstance = user ?? new User(authenticator);

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
