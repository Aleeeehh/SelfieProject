import type Note from "./Note.js";
import type Activity from "./Activity.js";
// import type UserResult from "./UserResult.js";

type Project = {
	id?: string;
	title: string;
	description: string;
	owner: string;
	accessList: string[]; // username list
	activityList: Activity[];
	accessListAccepted: string[]; // username list
	createdAt?: Date;
	updatedAt?: Date;
	note?: Note;
};

export default Project;
