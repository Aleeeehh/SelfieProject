import mongoose from "mongoose";

const pomodoroSchema = new mongoose.Schema(
	{
		owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		studyTime: { type: Number, required: true },
		pauseTime: { type: Number, required: true },
		cycles: { type: Number, required: true },
	},
	{ timestamps: true }
);

const PomodoroSchema = mongoose.model("Pomodoro", pomodoroSchema);

export default PomodoroSchema;
