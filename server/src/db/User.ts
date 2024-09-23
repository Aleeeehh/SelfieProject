import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true },
		password: { type: String, required: true },
		firstName: String,
		lastName: String,
		birthday: Date,
		address: String,
	},
	{ timestamps: true }
);

const UserSchema = mongoose.model("User", userSchema);

export default UserSchema;
