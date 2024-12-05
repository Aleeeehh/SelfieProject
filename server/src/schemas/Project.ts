import mongoose from "mongoose";

// note id is not used by the schema, as the relation is in the note document
// activity list is not defined as every activity related to the project has a projectId field
// TODO: manage project access list as different collection
const projectSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		description: { type: String, required: true, default: "" },
		// deadline: { type: Date, required: true },
		//tags: { type: [String], required: true },
		owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		accessList: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
			required: true,
		},
		accessListAccepted: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
			required: false,
		},
	},
	{ timestamps: true }
);

export const ProjectSchema = mongoose.model("Project", projectSchema);

export type ProjectDBSchema = {
	title: string,
	description: string,
	owner: mongoose.Types.ObjectId,
	accessList: mongoose.Types.ObjectId[],
}