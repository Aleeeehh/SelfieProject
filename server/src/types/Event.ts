import type { Frequency } from "../enums.js";

export type Event = {
	id: String;
	title: string;
	start: Date;
	end: Date;
	frequency: Frequency;
	location: string;
};
