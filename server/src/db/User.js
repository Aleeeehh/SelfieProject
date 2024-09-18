import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
	username: String,
	password: String,
	firstName: String,
	lastName: String,
	birthday: Date,
	address: String,
});
