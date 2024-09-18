import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
	user: { type: Schema.Object.id, ref: "User" },
	duration: Number,
});
