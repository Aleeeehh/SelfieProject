import type { Types } from "mongoose";
import UserSchema from "../schemas/User.ts";

export async function getUsernameListFromIdList(list: Types.ObjectId[]): Promise<string[]> {
	const accessList = [];
	for (const access of list) {
		const foundUser = await UserSchema.findById(access.toString()).lean();
		if (foundUser) {
			accessList.push(foundUser.username);
		}
	}

	return accessList;
}

export async function getIdListFromUsernameList(usernames: string[]): Promise<Types.ObjectId[]> {
	const idList: Types.ObjectId[] = [];
	for (const username of usernames) {
		const foundUser = await UserSchema.findOne({
			username: username,
		}).lean();
		if (foundUser) {
			idList.push(foundUser._id);
		}
	}
	return idList;
}
