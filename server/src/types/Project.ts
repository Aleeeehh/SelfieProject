import { Types } from "mongoose";

type Project = {
	title: string;
	description?: string;
	owner: string | Types.ObjectId;
	userList: string[] | Types.ObjectId[];
	activityList: string[] | Types.ObjectId[];
	createdAt?: Date;
	updatedAt?: Date;
};

export default Project;
