import type { Frequency } from "../enums.js";

export type Event = {
	id: string;
	owner: string;
	title: string;
	startTime: Date;
	endTime: Date;
	frequency: Frequency;
	location: string;
	createdAt?: Date;
	updatedAt?: Date;
};
