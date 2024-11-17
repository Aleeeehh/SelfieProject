import mongoose from "mongoose";
import { AdvancementType } from "../types/Activity.ts";

// "status" è un parametro derivato parzialmente: gli unici parametri
// "selezionabili" sono [Attiva (actor) | Completa (actor) | Riattivata (owner)],
// [Non Attivabile | Attivabile] dipende dallo status dell'output dell'attività
// precedente, [In Ritardo | Abbandonata] dipende dalla data di scadenza --> il
// server deve verificare e ritornare uno Status come risposta

const activitySchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		description: { type: String, required: true, default: "" },
		deadline: { type: Date, required: true },
		completed: { type: Boolean, default: false, required: true },
		completedAt: { type: Date },
		//tags: { type: [String], required: true },
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
		accessList: {
			type: [mongoose.Schema.Types.Mixed], // Modificato per accettare array di String o ObjectId
			ref: "User"
		},
		accessListAccepted: {
			type: [mongoose.Schema.Types.Mixed], // Modificato per accettare array di String o ObjectId
			required: false,
		},
		idEventoNotificaCondiviso: { type: String },

		// project related fields
		projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
		milestone: { type: Boolean, default: false },
		advancementType: {
			type: String,
			enum: AdvancementType,
			default: AdvancementType.TRANSLATION,
		},
		parent: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
		// prev: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
		next: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
		// status related fields
		active: { type: Boolean, default: false },
		abandoned: { type: Boolean, default: false },
		reactivated: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

activitySchema.pre("save", function (next) {
	if (this.projectId && !this.active) {
		next(new Error("'active' is required when projectId is defined"));
	}
	next();
});

activitySchema.pre("save", function (next) {
	if (this.projectId && !this.abandoned) {
		next(new Error("'abandoned' is required when projectId is defined"));
	}
	next();
});

activitySchema.pre("save", function (next) {
	if (this.projectId && !this.reactivated) {
		next(new Error("'reactivated' is required when projectId is defined"));
	}
	next();
});
export const ActivitySchema = mongoose.model("Activity", activitySchema);
