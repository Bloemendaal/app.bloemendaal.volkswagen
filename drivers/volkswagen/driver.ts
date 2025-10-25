import Homey from "homey";
import type { PairSession } from "homey/lib/Driver.js";
import User from "./api/user.js";

export default class VolkswagenDriver extends Homey.Driver {
	/**
	 * onInit is called when the driver is initialized.
	 */
	public async onInit() {
		this.log("VolkswagenDriver has been initialized");
	}

	public async onPair(session: PairSession): Promise<void> {
		let sPin = "";
		let email = "";
		let password = "";

		let user: User | null = null;

		session.setHandler("login", async (data) => {
			email = data.username;
			password = data.password;

			user = new User({ credentials: { email, password } });

			return user.canLogin();
		});

		session.setHandler("pincode", async (pincode: string[]) => {
			sPin = pincode.join("");

			return true;
		});

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
