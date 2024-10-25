import mongoose from "mongoose";

export enum NotificationMode {
	POMODORO = "pomodoro",
	EVENT = "event",
	NOTE = "note",
	ACTIVITY = "activity",
}

export enum NotificationStatus {
	SUCCESS = "sent",
	FAILED = "failed",
	PENDING = "pending",
}

const notificationSchema = new mongoose.Schema(
	{
		sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		message: { type: String, required: true },
		type: { type: String, enum: ["email", "push", "sms"], required: true },
		sentAt: { type: Date, required: true },
		status: { type: String, enum: ["sent", "pending", "failed"], required: true },
		mode: {
			type: String,
			enum: [
				NotificationMode.POMODORO,
				NotificationMode.EVENT,
				NotificationMode.NOTE,
				NotificationMode.ACTIVITY,
			],
			required: true,
		},
		read: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

const NotificationSchema = mongoose.model("Notification", notificationSchema);

export default NotificationSchema;
