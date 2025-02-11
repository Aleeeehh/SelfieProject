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
		owner: {
			type: mongoose.Schema.Types.Mixed, // Modificato per accettare sia ObjectId che String
			ref: "User",
			required: true,
			validate: {
				validator: function (value: any) {
					return (
						typeof value === 'string' ||
						mongoose.Types.ObjectId.isValid(value)
					);
				},
				message: (props: any) => `${props.value} non è un tipo valido! Deve essere una String o un ObjectId.`,
			},
		},
		isRisorsa: { type: Boolean, default: false, required: false },
		accessList: {
			type: [mongoose.Schema.Types.Mixed], // Modificato per accettare array di String o ObjectId
			ref: "User"
		},
		accessListAccepted: {
			type: [mongoose.Schema.Types.Mixed], // Modificato per accettare array di String o ObjectId
			required: false,
		},
		startTime: { type: Date, required: true }, //impostarlo a tipo mixed/generico?
		endTime: { type: Date, required: true },
		repetitions: { type: Number, required: true },
		frequency: { type: String, enum: ["once", "day", "week", "month", "year"], required: true },
		groupId: { type: String, required: true },
		untilDate: { type: Date, required: false },
		isInfinite: { type: Boolean, default: false, required: true },
		title: { type: String, required: true },
		recurring: { type: Boolean, default: false, required: true },
		recurrence: {
			type: RecurrenceSchema,
		},
		idEventoNotificaCondiviso: { type: String, required: false },
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
