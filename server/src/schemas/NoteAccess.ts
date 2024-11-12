/* import mongoose from "mongoose";

const noteAccessSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        noteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Note",
            required: true,
        },
    },
    { timestamps: true }
);

const NoteAccessSchema = mongoose.model("NoteAccess", noteAccessSchema);

export default NoteAccessSchema;*/

export {};
