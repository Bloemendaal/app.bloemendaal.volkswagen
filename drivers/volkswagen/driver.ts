import Homey from "homey";
import type { PairSession } from "homey/lib/Driver.js";
import User from "./api/user.js";

export default class VolkswagenDriver extends Homey.Driver {
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

				user = new User({ credentials: { email, password } });

				return await user.canLogin();
			},
		);

		session.setHandler(
			"pincode",
			async (pincode: string[]): Promise<boolean> => {
				sPin = pincode.join("");

				const userInstance =
					user ?? new User({ sPin, credentials: { email, password } });

				userInstance.setSPin(sPin);

				return await userInstance.verifySPin();
			},
		);

		session.setHandler("list_devices", async () => {
			const userInstance =
				user ?? new User({ sPin, credentials: { email, password } });

			userInstance.setSPin(sPin);

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
