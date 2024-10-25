type Recurrence = {
	daysApart?: number | null;
	daysOfWeek?: number[] | null;
	daysOfMonth?: number[] | null;
	repeatUntilDate?: Date | null;
	repeatCount?: number | null;
};

export type Event = {
	id: string;
	groupId: string;
	owner: string;
	title: string;
	startTime: Date;
	endTime: Date;
	recurring: boolean;
	repetitions: number;
	recurrence?: Recurrence | null;
	allDay?: boolean;
	location?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
};
