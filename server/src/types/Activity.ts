import type { Types } from "mongoose";

type Activity = {
	id?: Types.ObjectId | String;
	title: String;
	description?: String;
	deadline: Date;
	completed: boolean;
	completedAt?: Date;
	owner: String;
	idEventoNotificaCondiviso?: String;
	//tags: String[];
	createdAt?: Date;
	updatedAt?: Date;
	accessList: String[];
};

export default Activity;