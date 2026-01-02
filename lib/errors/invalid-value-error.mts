export default class InvalidValueError<TValue> extends Error {
	constructor(
		public readonly value: TValue,
		options?: ErrorOptions,
	) {
		super(`Invalid value received: ${JSON.stringify(value)}`, options);

		this.name = "InvalidValueError";
	}
}
