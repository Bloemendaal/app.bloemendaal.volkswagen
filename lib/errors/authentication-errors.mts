import TranslatableError from "./translatable-error.mjs";

export class AuthorizationUrlError extends TranslatableError {
	constructor(options?: ErrorOptions) {
		const name = "AuthorizationUrlError";
		super(name, options);
		this.name = name;
	}

	public get translationKey(): string {
		return "errors.authentication.authorization_url_failed";
	}
}

export class LoginFailedError extends TranslatableError {
	constructor(options?: ErrorOptions) {
		const name = "LoginFailedError";
		super(name, options);
		this.name = name;
	}

	public get translationKey(): string {
		return "errors.authentication.login_failed";
	}
}

export class AuthorizationParametersError extends TranslatableError {
	constructor(options?: ErrorOptions) {
		const name = "AuthorizationParametersError";
		super(name, options);
		this.name = name;
	}

	public get translationKey(): string {
		return "errors.authentication.authorization_parameters_failed";
	}
}

export class TokenExchangeError extends TranslatableError {
	constructor(options?: ErrorOptions) {
		const name = "TokenExchangeError";
		super(name, options);
		this.name = name;
	}

	public get translationKey(): string {
		return "errors.authentication.token_exchange_failed";
	}
}
