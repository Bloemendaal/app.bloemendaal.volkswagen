import TranslatableError from "../../errors/translatable-error.mjs";
import type { Authenticatable, AuthSettings } from "../authenticatable.mjs";
import type BaseVehicle from "../vehicles/base-vehicle.mjs";

interface Translator {
	__(key: string | object, tags?: object | undefined): string;
}

/**
 * Base User class for all VAG Group brands
 * Provides common functionality for Volkswagen, SEAT, Cupra, and Skoda
 */
export default abstract class BaseUser {
	constructor(protected readonly authenticator: Authenticatable) {}

	public getAuthenticator(): Authenticatable {
		return this.authenticator;
	}

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

	/**
	 * Abstract method to verify S-PIN - must be implemented by subclasses
	 * Different brands use different API endpoints for S-PIN verification
	 */
	public abstract verifySPin(userId?: string): Promise<boolean>;

	/**
	 * Abstract method to get vehicles - must be implemented by subclasses
	 * Different brands return different vehicle types from different endpoints
	 */
	public abstract getVehicles(): Promise<BaseVehicle[]>;
}
