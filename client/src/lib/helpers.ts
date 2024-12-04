import type Activity from "../types/Activity";
import { ActivityStatus } from "../types/Activity";

export function getActivityStatus(refTime: number, activity: Activity): string {
	if (activity.completed) return ActivityStatus.COMPLETED;

	const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
	if (
		refTime > new Date(activity.deadline).getTime() + THIRTY_DAYS ||
		activity.status === ActivityStatus.ABANDONED
	)
		return ActivityStatus.ABANDONED;
	if (refTime > new Date(activity.deadline).getTime()) return ActivityStatus.LATE;

	return activity.status || "";
}
