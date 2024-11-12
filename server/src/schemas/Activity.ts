import mongoose from "mongoose";
import { ActivityStatus, AdvancementType } from "../types/Activity.ts";

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
		owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		accessList: { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
		idEventoNotificaCondiviso: { type: String },

		// project related fields
		status: {
			type: String,
			enum: ActivityStatus,
		},
		projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
		start: { type: Date },
		milestone: { type: Boolean, default: false },
		advancementType: {
			type: String,
			enum: AdvancementType,
			default: AdvancementType.TRANSLATION,
		},
		parent: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
		prev: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
		next: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
	},
	{ timestamps: true }
);

activitySchema.pre("save", function (next) {
	if (this.projectId && !this.status) {
		next(new Error("'status' is required when projectId is defined"));
	}
	next();
});

activitySchema.pre("save", function (next) {
	if (this.projectId && !this.start) {
		next(new Error("'start' is required when projectId is defined"));
	}
	next();
});
export const ActivitySchema = mongoose.model("Activity", activitySchema);
