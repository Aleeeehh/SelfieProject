import type { Types } from "mongoose";

type Notification = {
	id?: string | Types.ObjectId;
	sender?: string | Types.ObjectId;
	receiver?: string | Types.ObjectId;
	type: string;
	sentAt: Date;
	message: string;
	read?: boolean;
	data: Object;
};

export default Notification;
