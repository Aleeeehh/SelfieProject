import mongoose from "mongoose";

const noteItemSchema = new mongoose.Schema(
    {
        noteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Note",
            required: true,
        },
        text: { type: String, required: true },
        completed: { type: Boolean, required: true, default: false },
    },
    { timestamps: true }
);

const NoteItemSchema = mongoose.model("NoteItem", noteItemSchema);

export default NoteItemSchema;
