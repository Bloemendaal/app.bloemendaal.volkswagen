import type {
	Authenticatable,
	AuthSettings,
} from "#lib/api/authenticators/authenticatable.mjs";
import type VagVehicle from "#lib/api/vehicles/vag-vehicle.mjs";
import TranslatableError from "#lib/errors/translatable-error.mjs";

interface Translator {
	__(key: string | object, tags?: object | undefined): string;
}

export default abstract class VagUser {
	constructor(public readonly authenticator: Authenticatable) {}

	public async getSettings(): Promise<AuthSettings> {
		return await this.authenticator.getSettings();
	}

	public async canLogin(translator: Translator): Promise<boolean> {
		try {
			await this.authenticator.getClient();
		} catch (error) {
			if (error instanceof TranslatableError) {
				throw new Error(translator.__(error.translationKey), {
					cause: error,
				});
			}
			return false;
		}

		return true;
	}

	public abstract verifySPin(): Promise<boolean>;

	public abstract getVehicles(): Promise<VagVehicle[]>;
}
