import mongoose from "mongoose";
import { Frequency } from "../enums.js";

const eventSchema = new mongoose.Schema(
	{
		owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		startTime: { type: Date, required: true },
		endTime: { type: Date, required: true },
		title: { type: String, required: true },
		frequency: {
			type: String,
			enum: [Frequency.ONCE, Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY],
			default: Frequency.ONCE,
		},
		location: { type: String, required: true },
		// notificationMethod: { type: String, enum: ["os", "whatsapp", "email"] },
		// notificationAnticipation: { type: Number, required: true },
		// notificationRepetition: {
		// 	type: String,
		// 	enum: ["once", "multiple", "untilresponse", "hourly"],
		// },
		users: {
			type: [
				{
					user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
					accepted: {
						type: String,
						enum: ["accepted", "rifiuted", "waiting"],
						default: "waiting",
					},
				},
			],
			required: true,
		},
	},
	{ timestamps: true }
);

const EventSchema = mongoose.model("Event", eventSchema);

export default EventSchema;
