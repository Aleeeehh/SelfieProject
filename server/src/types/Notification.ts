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
	isInfiniteEvent?: boolean;
	frequencyEvent?: string;
};

// Come sono definiti gli oggetti "data" della notifica:
// POMODORO TYPE:
// "cycles", "studyTime", "pauseTime"
// PROJECT TYPE:
// "projectId", "activityId", "action" ["create", "update", "delete"],
// "type" ["traslazione", "contrazione"]
// EVENT TYPE:
// usato il field message (TODO: si può migliorare?)

export default Notification;
