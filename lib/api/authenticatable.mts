import type { AxiosInstance } from "axios";

export interface Credentials {
	email: string;
	password: string;
}

export interface TokenStore {
	idToken: string;
	accessToken: string;
	refreshToken?: string;
	expiresAt: number;
}

export interface Configuration {
	credentials: Credentials;
	tokenStore?: TokenStore | null;
	sPin?: string | null;
}

export interface AuthSettings extends Credentials, TokenStore {
	sPin?: string | null;
}

export type SettingsUpdateCallback = (settings: AuthSettings) => void;

export interface Authenticatable {
	getClient(): Promise<AxiosInstance>;

	getSettings(): Promise<AuthSettings>;

	getConfiguration(): Configuration;

	setSPin(sPin: string | null): void;

	onSettingsUpdate(callback: SettingsUpdateCallback): void;

	getUserId(): string | null;
}
