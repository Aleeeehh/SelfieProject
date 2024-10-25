type Recurrence = {
	daysApart?: number | null;
	daysOfWeek?: number[] | null;
	daysOfMonth?: number[] | null;
	repeatUntilDate?: Date | null;
	repeatCount?: number | null;
};

export type Frequency = "once" | "day" | "week" | "month" | "year";
export type Event = {
	id: string;
	groupId: string;
	owner: string;
	title: string;
	startTime: Date;
	frequency: Frequency;
	endTime: Date;
	recurring: boolean;
	repetitions: number;
	untilDate?: Date | null;
	recurrence?: Recurrence | null;
	allDay?: boolean;
	location?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
};
