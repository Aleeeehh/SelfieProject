import type { Frequency } from "../enums.js";

export type Event = {
	_id: string;
	groupId: string;
	owner: string;
	title: string;
	startTime: Date;
	endTime: Date;
	frequency: Frequency;
	until: Date | null;
	repetitions: number | null;
	location: string;
	createdAt?: Date;
	updatedAt?: Date;
};
