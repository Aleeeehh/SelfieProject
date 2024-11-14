import type { Types } from "mongoose";
import UserSchema from "../schemas/User.ts";
import type Activity from "../types/Activity.ts";
import { ActivitySchema } from "../schemas/Activity.ts";
import { ActivityStatus, type AdvancementType } from "../types/Activity.ts";

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

// if parentID === undefined, then get the activity list for the project
export async function getActivityList(
	projectId: Types.ObjectId | undefined,
	parentId: Types.ObjectId | undefined
): Promise<Activity[]> {
	// get all activities for projectId

	if (!projectId) {
		console.log("No projectId");
		return [];
	}

	console.log("Searching: project ", projectId, " parent ", parentId);
	const foundActivities = await ActivitySchema.find({
		projectId: projectId,
		parent: parentId,
	}).lean();

	const activityList: Activity[] = [];

	// if parent, push the activity to the children of the parent activity
	for (const foundActivity of foundActivities) {
		const newActivity: Activity = {
			id: foundActivity._id.toString(),
			title: foundActivity.title,
			description: foundActivity.description,
			deadline: foundActivity.deadline,
			completed: foundActivity.completed,
			owner: foundActivity.owner.toString(),
			accessList: await getUsernameListFromIdList(foundActivity.accessList),
			projectId: foundActivity.projectId || null,
			start: foundActivity.start || null,
			milestone: foundActivity.milestone,
			advancementType: (foundActivity.advancementType as AdvancementType) || null,
			parent: foundActivity.parent || null,
			// prev: foundActivity.prev || undefined,
			next: foundActivity.next || null,
			status: await getActivityStatus(),
			children: await getActivityList(projectId, foundActivity._id),
		};

		activityList.push(newActivity);
	}

	return activityList;
}

export async function getActivityStatus(): Promise<ActivityStatus> {
	// TODO: implement function
	console.log("getActivityStatus() not implemented yet");
	return ActivityStatus.ACTIVE;
}

export async function getActivityFromActivityId(id: string): Promise<Activity | null> {
	const document = await ActivitySchema.findById(id).lean();

	if (!document) {
		return null;
	}

	const newActivity: Activity = {
		id: document._id.toString(),
		title: document.title,
		description: document.description,
		deadline: document.deadline,
		completed: document.completed,
		owner: document.owner.toString(),
		accessList: await getUsernameListFromIdList(document.accessList),
		projectId: document.projectId || null,
		start: document.start || null,
		milestone: document.milestone,
		advancementType: (document.advancementType as AdvancementType) || null,
		parent: document.parent || null,
		// prev: foundActivity.prev || undefined,
		next: document.next || null,
		status: await getActivityStatus(),
		children: await getActivityList(document.projectId || undefined, document._id),
	};

	return newActivity;
}
