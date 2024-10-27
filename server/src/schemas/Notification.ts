import mongoose from "mongoose";

export enum NotificationType {
    POMODORO = "pomodoro",
    EVENT = "event",
    MESSAGE = "message",
    ACTIVITY = "activity",
}

const notificationSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
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
