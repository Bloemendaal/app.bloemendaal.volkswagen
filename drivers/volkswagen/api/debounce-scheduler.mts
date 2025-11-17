const MINIMUM_DELAY = 2000;
const MAXIMUM_DELAY = MINIMUM_DELAY * 2;

interface Bounds {
	minimum: number;
	maximum: number;
}

type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject = (reason?: unknown) => void;

interface PushedEntry<T> {
	bounds: Bounds;
	reject: Reject;
	resolve: Resolve<T>;
}

interface IntervalHandlers<T> {
	onSuccess?: Resolve<T>;
	onError?: Reject;
	onFinally?: () => void;
}

class TimelineEntry<T> {
	private readonly rejects: Reject[] = [];
	private readonly resolves: Resolve<T>[] = [];

	private timeout: NodeJS.Timeout | null = null;
	private timestampBounds: Bounds = {
		minimum: Number.MIN_SAFE_INTEGER,
		maximum: Number.MAX_SAFE_INTEGER,
	};

	constructor(private readonly scheduler: DebounceScheduler<T>) {}

	public get minimum(): number {
		return this.timestampBounds.minimum;
	}

	public get maximum(): number {
		return this.timestampBounds.maximum;
	}

	public overlaps(bounds: Bounds): boolean {
		return (
			bounds.minimum <= this.timestampBounds.maximum &&
			bounds.maximum >= this.timestampBounds.minimum
		);
	}

	public push({ bounds, resolve, reject }: PushedEntry<T>): this {
		this.rejects.push(reject);
		this.resolves.push(resolve);

		const minimum = Math.max(bounds.minimum, this.timestampBounds.minimum);

		if (minimum !== this.timestampBounds.minimum) {
			if (this.timeout) {
				clearTimeout(this.timeout);
			}

			this.timeout = setTimeout(this.handle.bind(this), minimum - Date.now());
		}

		this.timestampBounds = {
			minimum,
			maximum: Math.min(bounds.maximum, this.timestampBounds.maximum),
		};

		return this;
	}

	public reject(reason?: unknown): void {
		for (const reject of this.rejects) {
			reject(reason);
		}
	}

	public resolve(value: T): void {
		for (const resolve of this.resolves) {
			resolve(value);
		}
	}

	public destroy(): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		this.reject(new Error("DebounceScheduler destroyed"));
	}

	private async handle(): Promise<void> {
		try {
			this.resolve(await this.scheduler.callback());
		} catch (error) {
			this.reject(error);
		} finally {
			this.scheduler.removeEntry(this);
		}
	}
}

export default class DebounceScheduler<T> {
	private readonly timeline: TimelineEntry<T>[] = [];

	private pollingInterval: NodeJS.Timeout | null = null;
	private scheduleTimeout: NodeJS.Timeout | null = null;

	constructor(
		public readonly callback: () => Promise<T>,
		private readonly defaultDelayBounds: Bounds = {
			minimum: MINIMUM_DELAY,
			maximum: MAXIMUM_DELAY,
		},
	) {}

	public schedule(delayBounds: Bounds = this.defaultDelayBounds): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			if (
				delayBounds.minimum < 0 ||
				delayBounds.maximum < delayBounds.minimum
			) {
				reject(new Error("Invalid delay bounds"));
				return;
			}

			const now = Date.now();

			const bounds = {
				minimum: now + delayBounds.minimum,
				maximum: now + delayBounds.maximum,
			};

			const pushEntry: PushedEntry<T> = {
				bounds,
				reject,
				resolve,
			};

			let foundOverlappingEntry = false;

			for (const entry of this.timeline) {
				if (!entry.overlaps(bounds)) {
					continue;
				}

				foundOverlappingEntry = true;
				entry.push(pushEntry);

				break;
			}

			if (!foundOverlappingEntry) {
				const entry = new TimelineEntry<T>(this).push(pushEntry);

				this.timeline.push(entry);
				this.timeline.sort(
					(a, b) => a.minimum - b.minimum || a.maximum - b.maximum,
				);
			}
		});
	}

	public startInterval(
		delay: number,
		delayBounds: Bounds = this.defaultDelayBounds,
		handlers: IntervalHandlers<T> = {},
	): void {
		this.stopInterval();

		this.handleInterval(delayBounds, handlers);
		this.pollingInterval = setInterval(
			() => this.handleInterval(delayBounds, handlers),
			delay,
		);
	}

	public stopInterval(): void {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
		}

		if (this.scheduleTimeout) {
			clearTimeout(this.scheduleTimeout);
			this.scheduleTimeout = null;
		}
	}

	public removeEntry(entry: TimelineEntry<T>): void {
		const index = this.timeline.indexOf(entry);

		if (index !== -1) {
			this.timeline.splice(index, 1);
		}
	}

	public destroy(): void {
		for (const entry of this.timeline) {
			entry.destroy();
		}
	}

	private async handleInterval(
		delayBounds: Bounds,
		{ onSuccess, onError, onFinally }: IntervalHandlers<T>,
	): Promise<void> {
		try {
			const result = await this.schedule(delayBounds);
			onSuccess?.(result);
		} catch (error) {
			onError?.(error);
		} finally {
			onFinally?.();
		}
	}
}
