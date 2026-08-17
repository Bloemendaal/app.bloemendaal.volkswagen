import JSON5 from "json5";

/**
 * Templates rendered by VW's IdentityKit (IDKit) login pages. The template name
 * tells us which step of the login we are looking at.
 */
export const IdKitStage = {
	Identifier: "loginIdentifier",
	Password: "loginAuthenticate",
	Confirm: "codeConfirmation",
	Success: "verificationSuccess",
} as const;

export type IdKitStage = (typeof IdKitStage)[keyof typeof IdKitStage];

// Every IDKit page bootstraps itself from a `window._IDK = { ... }` assignment
// inside an inline script. It is a JavaScript object literal (unquoted keys,
// single quotes, trailing commas), so it needs a JSON5 parser rather than JSON.
const ASSIGNMENT = "window._IDK";

// Base only used to resolve the relative device URL found in the page.
const URL_BASE = "https://identity.vwgroup.io";

export class IdKitPageError extends Error {}

function asString(value: unknown): string | null {
	return typeof value === "string" && value.length > 0 ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

/**
 * Returns the object literal starting at `start` (which must point at a `{`),
 * ignoring braces that appear inside strings or comments.
 */
function extractObjectLiteral(source: string, start: number): string {
	let depth = 0;
	let quote: string | null = null;
	let escaped = false;

	for (let index = start; index < source.length; index++) {
		const character = source[index];

		if (quote !== null) {
			if (escaped) {
				escaped = false;
			} else if (character === "\\") {
				escaped = true;
			} else if (character === quote) {
				quote = null;
			}

			continue;
		}

		if (character === '"' || character === "'" || character === "`") {
			quote = character;
			continue;
		}

		if (character === "/" && source[index + 1] === "/") {
			const lineEnd = source.indexOf("\n", index);
			if (lineEnd < 0) {
				break;
			}

			index = lineEnd;
			continue;
		}

		if (character === "/" && source[index + 1] === "*") {
			const commentEnd = source.indexOf("*/", index + 2);
			if (commentEnd < 0) {
				break;
			}

			index = commentEnd + 1;
			continue;
		}

		if (character === "{") {
			depth++;
		} else if (character === "}") {
			depth--;

			if (depth === 0) {
				return source.slice(start, index + 1);
			}
		}
	}

	throw new IdKitPageError(`Unterminated ${ASSIGNMENT} object literal`);
}

/**
 * The `window._IDK` object of a single IDKit page, with the fields the login
 * flow needs to submit the next step.
 */
export default class IdKitPage {
	private readonly object: Record<string, unknown>;
	private readonly templateModel: Record<string, unknown>;
	private readonly deviceUrl: Record<string, string>;

	private constructor(object: Record<string, unknown>) {
		const templateModel = asRecord(object.templateModel);

		if (!templateModel) {
			throw new IdKitPageError(`${ASSIGNMENT} is missing templateModel`);
		}

		this.object = object;
		this.templateModel = templateModel;
		this.deviceUrl = IdKitPage.parseDeviceUrl(templateModel);
	}

	public static fromHtml(html: unknown): IdKitPage {
		if (typeof html !== "string") {
			throw new IdKitPageError("Login page response was not HTML");
		}

		const assignmentIndex = html.indexOf(ASSIGNMENT);

		if (assignmentIndex < 0) {
			throw new IdKitPageError(`${ASSIGNMENT} not found in login page`);
		}

		const objectStart = html.indexOf("{", assignmentIndex + ASSIGNMENT.length);

		if (objectStart < 0) {
			throw new IdKitPageError(`${ASSIGNMENT} is not an object literal`);
		}

		const literal = extractObjectLiteral(html, objectStart);

		let parsed: unknown;
		try {
			parsed = JSON5.parse(literal);
		} catch (cause) {
			throw new IdKitPageError(`Failed to parse ${ASSIGNMENT}`, { cause });
		}

		const object = asRecord(parsed);

		if (!object) {
			throw new IdKitPageError(`${ASSIGNMENT} is not an object`);
		}

		return new IdKitPage(object);
	}

	/**
	 * The template VW rendered. Returned as-is rather than validated against
	 * {@link IdKitStage}, so callers can report which unexpected page they
	 * landed on — VW inserts interstitials such as consent pages.
	 */
	public get stage(): string {
		const template = asString(this.templateModel.template);

		if (!template) {
			throw new IdKitPageError(
				`${ASSIGNMENT} is missing templateModel.template`,
			);
		}

		return template;
	}

	public get csrfToken(): string | null {
		return asString(this.object.csrf_token);
	}

	public get clientId(): string | null {
		const clientModel = asRecord(this.templateModel.clientLegalEntityModel);

		return (
			asString(clientModel?.clientId) ?? asString(this.deviceUrl.client_id)
		);
	}

	public get relayState(): string | null {
		return (
			asString(this.templateModel.relayState) ??
			asString(this.deviceUrl.relayState)
		);
	}

	public get hmac(): string | null {
		return asString(this.templateModel.hmac) ?? asString(this.deviceUrl.hmac);
	}

	public get userCode(): string | null {
		return asString(this.deviceUrl.user_code);
	}

	public get userId(): string | null {
		return asString(this.deviceUrl.user_id);
	}

	public get clientIdentityName(): string | null {
		return asString(this.templateModel.clientIdentityName);
	}

	public get email(): string | null {
		return asString(asRecord(this.templateModel.emailPasswordForm)?.email);
	}

	/**
	 * The confirmation page links to `/device/{clientId}/{userCode}` with the
	 * relay state, user id and hmac in the query string. Those values are not
	 * repeated in the template model, so they are read from the URL.
	 */
	private static parseDeviceUrl(
		templateModel: Record<string, unknown>,
	): Record<string, string> {
		const rawUrl = asString(templateModel.url);

		if (!rawUrl) {
			return {};
		}

		let url: URL;
		try {
			url = new URL(rawUrl, URL_BASE);
		} catch {
			return {};
		}

		const result: Record<string, string> = {};
		const segments = url.pathname.split("/").filter(Boolean);

		if (segments.length === 3 && segments[0] === "device") {
			result.client_id = decodeURIComponent(segments[1]);
			result.user_code = decodeURIComponent(segments[2]);
		}

		for (const key of ["relayState", "user_id", "hmac"]) {
			const value = url.searchParams.get(key);

			if (value) {
				result[key] = value;
			}
		}

		return result;
	}
}
