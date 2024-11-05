import { Types } from "mongoose";
import type Note from "./Note.ts";
import type Activity from "./Activity.ts";
import type UserResult from "./UserResult.ts";

type Project = {
	id?: string | Types.ObjectId;
	title: string;
	description: string;
	owner: string | Types.ObjectId;
	accessList: UserResult[];
	activityList: Activity[];
	createdAt?: Date;
	updatedAt?: Date;
	note: Note;
};

export default Project;
