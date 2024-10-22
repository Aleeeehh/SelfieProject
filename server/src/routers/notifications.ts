import express, { Request, Response } from "express";
import NotificationSchema from "../schemas/Notification.js";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";

const router = express.Router();

async function createNotification(userId: string, message: string, type: string) {
	const notification = new NotificationSchema({ userId, message, type });
	await notification.save();
	return notification;
}

async function getNotifications(userId: string) {
	const notifications = await NotificationSchema.find({ userId }).lean();
	return notifications;
}

async function updateNotificationStatus(notificationId: string, status: string) {
	await NotificationSchema.findByIdAndUpdate(notificationId, { status });
}

router.post("/", async (req: Request, res: Response) => {
	try {
		const { userId, message, type } = req.body;
		// TODO: validate body

		const notification = await createNotification(userId, message, type);
		const response: ResponseBody = {
			message: "Notification created",
			status: ResponseStatus.GOOD,
			value: notification,
		};
		return res.status(200).json(response);
	} catch (e) {
		console.log(e);
		const response: ResponseBody = {
			message: "Failed to create notification",
			status: ResponseStatus.BAD,
		};
		return res.status(500).json(response);
	}
});

router.get("/", async (req: Request, res: Response) => {
	try {
		// TODO: validate param
		const userId = req.user?.id;

		if (!userId) {
			const response: ResponseBody = {
				message: "User not authenticated",
				status: ResponseStatus.BAD,
			};
			return res.status(401).json(response);
		}

		const count = req.query.count as number | undefined;

		const notifications = await getNotifications(userId);

		if (count && notifications.length > count) {
			// return only the first "count" number of notifications
			notifications.length = count;
		}

		const response: ResponseBody = {
			message: "Notifications retrieved",
			status: ResponseStatus.GOOD,
			value: notifications,
		};
		return res.status(200).json(response);
	} catch (e) {
		console.log(e);
		const response: ResponseBody = {
			message: "Failed to get notifications",
			status: ResponseStatus.BAD,
		};
		return res.status(500).json(response);
	}
});

router.patch("/:notificationId", async (req: Request, res: Response) => {
	try {
		const notificationId = req.params.notificationId;
		const status = req.body.status;
		await updateNotificationStatus(notificationId, status);
		const response: ResponseBody = {
			message: "Notification status updated",
			status: ResponseStatus.GOOD,
		};
		return res.json(response);
	} catch (e) {
		console.log(e);
		const response: ResponseBody = {
			message: "Failed to update notification status",
			status: ResponseStatus.BAD,
		};
		return res.status(500).json(response);
	}
});

export default router;
