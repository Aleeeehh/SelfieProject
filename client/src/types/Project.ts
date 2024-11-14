import type Note from "./Note.js";
import type Activity from "./Activity.js";
// import type UserResult from "./UserResult.ts";

type Project = {
	id?: string;
	title: string;
	description: string;
	owner: string;
	accessList: string[]; // username list
	activityList: Activity[];
	createdAt?: Date;
	updatedAt?: Date;
	note?: Note;
};

export default Project;
