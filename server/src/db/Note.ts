import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		text: String,
		categories: [String],
	},
	{ timestamps: true }
);

const NoteSchema = mongoose.model("Note", noteSchema);

export default NoteSchema;
