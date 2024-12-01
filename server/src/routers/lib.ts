import type { Types } from "mongoose";
import UserSchema from "../schemas/User.ts";
import type Activity from "../types/Activity.ts";
import { ActivitySchema } from "../schemas/Activity.ts";
import { ActivityStatus, type AdvancementType } from "../types/Activity.ts";

// 30 days
const MAX_TIME_BEFORE_ABANDON = 30 * 24 * 60 * 60 * 1000;

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
// sorts the activity list by start date
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
			// start: foundActivity.start || null,
			milestone: foundActivity.milestone,
			advancementType: (foundActivity.advancementType as AdvancementType) || null,
			parent: foundActivity.parent || null,
			// prev: foundActivity.prev || undefined,
			next: foundActivity.next || null,
			status: null,
			children: await getActivityList(projectId, foundActivity._id),
			start: foundActivity.start || null,
			active: foundActivity.active,
			abandoned: foundActivity.abandoned,
			reactivated: foundActivity.reactivated,
		};

		newActivity.status = await getStatusForActivity(newActivity);

		activityList.push(newActivity);
	}

	activityList.sort((a, b) => {
		if (a.start && b.start) {
			return a.start.getTime() - b.start.getTime();
		}
		return a.deadline.getTime() - b.deadline.getTime();
	});

	return activityList;
}

/* export async function getActivityFromActivityId(id: string): Promise<Activity | null> {
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
		// start: document.start || null,
		milestone: document.milestone,
		advancementType: (document.advancementType as AdvancementType) || null,
		parent: document.parent || null,
		// prev: foundActivity.prev || undefined,
		next: document.next || null,
		status: await getActivityStatus(),
		children: await getActivityList(document.projectId || undefined, document._id),
		start: document.start || null,
		active: document.active,
		abandoned: document.abandoned,
		reactivated: document.reactivated,
	};

	return newActivity;
}*/

import CurrentDateSchema from "../schemas/currentDate.js";

export async function getStatusForActivity(activity: Activity): Promise<ActivityStatus> {
	const dateObj = await CurrentDateSchema.findOne();
	const serverTime = new Date(dateObj?.date || new Date()).getTime();

	console.log(
		"Start: " + new Date(activity.start || new Date()),
		"Deadline: " + new Date(activity.deadline),
		"Server Time: " + new Date(serverTime)
	);

	// if prev activity is completed, the current is activable
	const prevActivities = await ActivitySchema.find({
		next: activity.id,
	}).lean();

	// console.log("Attività precedenti:", prevActivities);

	if (prevActivities.length > 0) {
		for (const prevActivity of prevActivities) {
			if (!prevActivity.completed) {
				return ActivityStatus.NOT_ACTIVABLE;
			}
		}
	}

	// activity is reactivated (only if activable)
	if (activity.reactivated) {
		// check if late
		if (new Date(activity.deadline).getTime() < serverTime) {
			return ActivityStatus.LATE;
		}

		// if activated but very late or marked as abandoned, return abandoned
		if (
			activity.abandoned ||
			new Date(activity.deadline).getTime() < serverTime + MAX_TIME_BEFORE_ABANDON
		) {
			return ActivityStatus.ABANDONED;
		}

		return ActivityStatus.REACTIVATED;
	}

	// activity is completed (only if activable)
	if (activity.completed) {
		return ActivityStatus.COMPLETED;
	}

	console.log(
		"HERE: ",
		activity.abandoned,
		new Date(activity.deadline).getTime(),
		serverTime + MAX_TIME_BEFORE_ABANDON
	);

	// if activated but very late or marked as abandoned, return abandoned
	if (
		activity.abandoned ||
		new Date(activity.deadline).getTime() + MAX_TIME_BEFORE_ABANDON < serverTime
	) {
		return ActivityStatus.ABANDONED;
	}

	// check if late
	if (new Date(activity.deadline).getTime() < serverTime) {
		return ActivityStatus.LATE;
	}

	if (activity.active) {
		// if not abandoned or late, return activated
		return ActivityStatus.ACTIVE;
	}

	return ActivityStatus.ACTIVABLE;
}
