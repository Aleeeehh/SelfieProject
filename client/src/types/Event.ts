import type { Frequency } from "../enums.js";

export type Event = {
	_id: string;
	idEventoNotificaCondiviso?: string;
	accessList?: string[] | null;
	accessListAccepted?: string[] | null;
	groupId: string;
	owner: string;
	title: string;
	startTime: Date;
	endTime: Date;
	frequency: Frequency;
	isInfinite: boolean;
	untilDate?: Date | null;
	repetitions: number;
	location: string;
	createdAt?: Date;
	updatedAt?: Date;
};
