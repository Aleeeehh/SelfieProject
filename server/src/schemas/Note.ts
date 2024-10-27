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
    },
    { timestamps: true }
);

const NoteSchema = mongoose.model("Note", noteSchema);

export default NoteSchema;
