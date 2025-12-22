export type Float = number;
export type Integer = number;
export type TimeString = string;
export type FloatString = string;
export type DateTimeString = string;
export type PossiblyUnknownString = string;

export type Weekday =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

export type UiComponent =
	| "toggle"
	| "slider"
	| "sensor"
	| "thermostat"
	| "media"
	| "color"
	| "battery"
	| "picker"
	| "ternary"
	| "button";

export interface CapabilityOptions {
	title: Translatable;
	getable: boolean;
	setable: boolean;
	units: Translatable;
	uiComponent: UiComponent | null;
}

export type Locale =
	| "da"
	| "de"
	| "en"
	| "es"
	| "fr"
	| "it"
	| "ko"
	| "nl"
	| "no"
	| "pl"
	| "ru"
	| "sv";

export type Translatable = string | { [locale in Locale]?: string };
