type Notification = {
	id: string;
	sender?: string;
	receiver?: string;
	type: string;
	sentAt: Date;
	message: string;
	read?: boolean;
	data: any;
	isInfiniteEvent?: boolean;
	frequencyEvent?: string;
};

export default Notification;
