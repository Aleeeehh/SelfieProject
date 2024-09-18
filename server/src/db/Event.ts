import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	duration: Number,
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
