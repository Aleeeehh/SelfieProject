import mongoose from "mongoose";

export enum Privacy {
	PUBLIC = "public",
	PROTECTED = "protected",
	PRIVATE = "private",
}

const noteSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		text: { type: String, required: true },
		tags: { type: [String], required: true },
		accessList: { type: [mongoose.Schema.Types.ObjectId], ref: "User", required: true },
		privacy: { type: String, enum: Privacy, required: true },
	},
	{ timestamps: true }
);

const NoteSchema = mongoose.model("Note", noteSchema);

export default NoteSchema;
