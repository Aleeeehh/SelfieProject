import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	message: { type: String, required: true },
	type: { type: String, enum: ["email", "push", "sms"] },
	sentAt: { type: Date },
	status: { type: String, enum: ["sent", "pending", "failed"] },
});

const NotificationSchema = mongoose.model("Notification", notificationSchema);

export default NotificationSchema;
