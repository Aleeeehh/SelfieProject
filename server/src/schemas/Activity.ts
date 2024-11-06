import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		description: { type: String, required: true, default: "" },
		deadline: { type: Date, required: true },
		completed: { type: Boolean, default: false, required: true },
		completedAt: { type: Date },
		//tags: { type: [String], required: true },
		owner: { type: String, required: true },
		accessList: { type: [String], required: true },
		idEventoNotificaCondiviso: { type: String },
	},
	{ timestamps: true }
);

export const ActivitySchema = mongoose.model("Activity", activitySchema);