import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
	title: String,
	text: String,
	categories: [String],
});

const NoteSchema = mongoose.model("Note", noteSchema);

export default NoteSchema;
