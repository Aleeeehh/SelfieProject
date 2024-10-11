import mongoose from "mongoose";

const RecurrenceSchema = new mongoose.Schema({
	daysApart: Number, // Repeat every X days
	daysOfWeek: [Number], // 0 (Sunday) - 6 (Saturday)
	daysOfMonth: [Number],
	repeatUntilDate: { type: Date }, // Repeat until a certain date
	repeatCount: { type: Number }, // Number of times to repeat
});

const eventSchema = new mongoose.Schema(
	{
		owner: { type: String, ref: "User", required: true },
		startTime: { type: Date, required: true }, //impostarlo a tipo mixed/generico?
		endTime: { type: Date, required: true },
		title: { type: String, required: true },
		recurring: { type: Boolean, default: false, required: true },
		recurrence: {
			type: RecurrenceSchema,
		},
		allDay: { type: Boolean, default: false },
		location: { type: String, required: false },
		// notificationMethod: { type: String, enum: ["os", "whatsapp", "email"] },
		// notificationAnticipation: { type: Number, required: true },
		// notificationRepetition: {
		// 	type: String,
		// 	enum: ["once", "multiple", "untilresponse", "hourly"],
		// },
		// users: {
		// 	type: [
		// 		{
		// 			user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		// 			accepted: {
		// 				type: String,
		// 				enum: ["accepted", "rifiuted", "waiting"],
		// 				default: "waiting",
		// 			},
		// 		},
		// 	],
		// 	required: true,
		// },
	},
	{ timestamps: true }
);

const EventSchema = mongoose.model("Event", eventSchema);

export default EventSchema;
