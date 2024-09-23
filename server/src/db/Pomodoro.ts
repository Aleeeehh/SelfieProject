import mongoose from "mongoose";

const pomodoroSchema = new mongoose.Schema(
	{
		owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		studyTime: Number,
		pauseTime: Number,
		cycles: Number,
	},
	{ timestamps: true }
);

const PomodoroSchema = mongoose.model("User", pomodoroSchema);

export default PomodoroSchema;
