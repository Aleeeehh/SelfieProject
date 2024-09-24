import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true },
		password: { type: String, required: true },
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		birthday: { type: Date, required: true },
		address: { type: String, required: true },
	},
	{ timestamps: true }
);

const UserSchema = mongoose.model("User", userSchema);

export default UserSchema;
