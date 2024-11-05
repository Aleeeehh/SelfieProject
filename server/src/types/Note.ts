import type { Types } from "mongoose";
import { Privacy } from "./Privacy.js";
import UserResult from "./UserResult.js";

export type ListItem = {
	id?: string;
	endDate?: Date;
	completed: boolean;
	text: string;
};

type Note = {
	id?: Types.ObjectId | string;
	owner: Types.ObjectId | string;
	title: String;
	text: String;
	tags: String[];
	privacy: Privacy;
	accessList: UserResult[];
	createdAt?: Date;
	updatedAt?: Date;
	toDoList?: ListItem[];

	// project related parameters
	projectId?: Types.ObjectId | string;
	activityId?: Types.ObjectId | string;
};

export default Note;
