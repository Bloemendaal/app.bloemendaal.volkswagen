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

export class EmailSubmissionError extends TranslatableError {
	constructor(options?: ErrorOptions) {
		const name = "EmailSubmissionError";
		super(name, options);
		this.name = name;
	}

	public get translationKey(): string {
		return "errors.authentication.email_submission_failed";
	}
}

export class IdentityProviderError extends TranslatableError {
	constructor(options?: ErrorOptions) {
		const name = "IdentityProviderError";
		super(name, options);
		this.name = name;
	}

	public get translationKey(): string {
		return "errors.authentication.identity_provider_failed";
	}
}

export class PasswordFormParseError extends TranslatableError {
	constructor(options?: ErrorOptions) {
		const name = "PasswordFormParseError";
		super(name, options);
		this.name = name;
	}

	public get translationKey(): string {
		return "errors.authentication.password_form_parse_failed";
	}
}

export class PasswordSubmissionError extends TranslatableError {
	constructor(options?: ErrorOptions) {
		const name = "PasswordSubmissionError";
		super(name, options);
		this.name = name;
	}

	public get translationKey(): string {
		return "errors.authentication.password_submission_failed";
	}
}
