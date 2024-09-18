enum Frequency {
	ONCE = "once",
	DAILY = "day",
	WEEKLY = "week",
}

export type Event = {
	title: string;
	start: Date;
	end: Date;
	frequency: Frequency;
	location: string;
};
