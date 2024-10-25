import type { Types } from "mongoose";

type Notification = {
	sender?: string | Types.ObjectId;
	receiver?: string | Types.ObjectId;
	message: string;
	type: string;
	sentAt: Date;
	status: string;
	mode: string;
    read?: boolean;
};

export default Notification;
