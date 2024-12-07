import { Types } from "mongoose";
import type Note from "./Note.js";
import type Activity from "./Activity.js";
// import type UserResult from "./UserResult.js";

type Project = {
	id?: string | Types.ObjectId;
	title: string;
	description: string;
	owner: string | Types.ObjectId;
	accessList: string[]; // username list
	accessListAccepted?: string[]; // username list
	activityList: Activity[];
	createdAt?: Date;
	updatedAt?: Date;
	note?: Note;
};

export default Project;
