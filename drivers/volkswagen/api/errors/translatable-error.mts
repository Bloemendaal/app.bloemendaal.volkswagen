export default abstract class TranslatableError extends Error {
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);

		this.name = "TranslatableError";
	}

	public abstract get translationKey(): string;
}
