import type { Frequency } from "../enums.js";

export type Event = {
	id: String;
	owner: String;
	title: string;
	startTime: Date;
	endTime: Date;
	recurring: Boolean;
	location: string;
	createdAt?: Date;
	updatedAt?: Date;
};
