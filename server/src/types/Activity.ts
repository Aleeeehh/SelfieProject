import type { Types } from "mongoose";

type Activity = {
	id?: Types.ObjectId | string;
	title: string;
	description?: string;
	deadline: Date;
	completed: boolean;
	completedAt?: Date;
	owner: Types.ObjectId;
	tags: string[];
	createdAt?: Date;
	updatedAt?: Date;
	accessList: Types.ObjectId[];
};

export default Activity;
