type Recurrence = {
	daysApart?: number | null;
	daysOfWeek?: number[] | null;
	daysOfMonth?: number[] | null;
	repeatUntilDate?: Date | null;
	repeatCount?: number | null;
};

export type Event = {
	id: string;
	owner: string;
	title: string;
	startTime: Date;
	endTime: Date;
	recurring: boolean;
	recurrence?: Recurrence | null;
	allDay?: boolean;
	location?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
};
