export default class NotImplementedError extends Error {
	constructor(options?: ErrorOptions) {
		super(`Not implemented`, options);

		this.name = "NotImplementedError";
	}
}
