import type { FetchData } from "#lib/api/fetch.mjs";

export interface RunOptions {
	isOutdated: boolean;
}

export interface Processable {
	register(fetchData: FetchData): Promise<void>;
	run(fetchData: FetchData, options?: RunOptions): Promise<void>;
}

export default class Processor implements Processable {
	constructor(private readonly processables: Processable[]) {}

	public async register(fetchData: FetchData): Promise<void> {
		const errors: unknown[] = [];

		for (const processable of this.processables) {
			try {
				await processable.register(fetchData);
			} catch (error) {
				errors.push(error);
			}
		}

		if (errors.length) {
			throw new AggregateError(
				errors,
				"Errors occurred while registering processables",
			);
		}
	}

	public async run(fetchData: FetchData, options?: RunOptions): Promise<void> {
		const errors: unknown[] = [];

		for (const processable of this.processables) {
			try {
				await processable.run(fetchData, options);
			} catch (error) {
				errors.push(error);
			}
		}

		if (errors.length) {
			throw new AggregateError(
				errors,
				"Errors occurred while running processables",
			);
		}
	}
}
