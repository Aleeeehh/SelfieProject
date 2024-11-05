import mongoose from "mongoose";
import { Privacy } from "../types/Privacy.js";

const noteSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		text: { type: String, required: true },
		tags: { type: [String], required: true },
		privacy: { type: String, enum: Privacy, required: true },

		// accessList related fields
		accessList: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],

		// project related fields
		projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
		activityId: { type: mongoose.Schema.Types.ObjectId, ref: "Activity" },
	},
	{ timestamps: true }
);

const NoteSchema = mongoose.model("Note", noteSchema);

export default NoteSchema;
