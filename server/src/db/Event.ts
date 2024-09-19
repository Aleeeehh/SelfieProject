import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
	owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	startTime: Date,
	endTime: Date,
	title: String,
	frequency: { type: String, enum: ["once", "daily", "weekly", "monthly"], default: "once" },
	location: String,
	notificationMethod: { type: String, enum: ["os", "whatsapp", "email"] },
	notificationAnticipation: Number,
	notificationRepetition: { type: String, enum: ["once", "multiple", "untilresponse", "hourly"] },
	users: [
		{
			user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
			accepted: {
				type: String,
				enum: ["accepted", "rifiuted", "waiting"],
				default: "waiting",
			},
		},
	],
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
