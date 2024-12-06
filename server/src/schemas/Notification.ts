import mongoose from "mongoose";

export enum NotificationType {
	POMODORO = "pomodoro",
	EVENT = "event",
	MESSAGE = "message",
	ACTIVITY = "activity",
	SHAREACTIVITY = "shareActivity",
	SHAREEVENT = "shareEvent",
	PROJECT = "Progetto",
	PROJECTACTIVITY = "ProjectActivity",
}

const notificationSchema = new mongoose.Schema(
	{
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		receiver: {
			type: String,
			required: true,
		},
		message: { type: String, required: true },
		sentAt: { type: Date, required: true },
		type: {
			type: String,
			enum: Object.values(NotificationType),
			required: true,
		},
		data: { type: Object, additionalProperties: true, required: true },
		read: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

const NotificationSchema = mongoose.model("Notification", notificationSchema);

export default NotificationSchema;
