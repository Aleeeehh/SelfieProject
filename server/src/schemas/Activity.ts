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
            enum: [
                ActivityStatus.ACTIVE,
                ActivityStatus.COMPLETED,
                ActivityStatus.REACTIVATED,
            ],
            required: true,
        },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
        start: { type: Date },
        milestone: { type: Boolean, default: false },
        advancementType: {
            type: String,
            enum: [AdvancementType.TRANSLATION, AdvancementType.CONTRACTION],
        },
        parent: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
        prev: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
        next: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
    },
    { timestamps: true }
);

export const ActivitySchema = mongoose.model("Activity", activitySchema);