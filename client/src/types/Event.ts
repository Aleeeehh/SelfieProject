import type { Frequency } from "../enums.js";

export type Event = {
	_id: string;
	owner: string;
	title: string;
	startTime: Date;
	endTime: Date;
	frequency: Frequency;
	location: string;
	createdAt?: Date;
	updatedAt?: Date;
};
