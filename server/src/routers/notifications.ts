import express, { Request, Response } from "express";
import NotificationSchema from "../schemas/Notification.js";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import type Notification from "../types/Notification.js";
const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
    try {
        const message = req.body.message as string | undefined;
        const type = req.body.type as string | undefined;
        const mode = req.body.mode as string | undefined;
        const receiver = req.body.receiver as string | undefined;
        const data = req.body.data as Object;

        // TODO: validate body
        if (!message || !type || !mode || !receiver) {
            const response: ResponseBody = {
                message:
                    "Invalid body: 'message', 'type', 'mode' and 'receiver' required",
                status: ResponseStatus.BAD,
            };
            return res.status(400).json(response);
        }
        if (!req.user || !req.user.id) {
            const response: ResponseBody = {
                message: "User not authenticated",
                status: ResponseStatus.BAD,
            };
            return res.status(401).json(response);
        }
        console.log("MESSAGGIO DELL'EVENTO:", message);
        const sender = req.user.id;
        const newNotification: Notification = {
            data,
            sender,
            receiver,
            message,
            type,
            sentAt: new Date(),
        };

        const notification = await NotificationSchema.create(newNotification);
        console.log("NOTIFICA CREATA:", notification);
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
        const notifications = await NotificationSchema.find({
            receiver: userId,
        }).lean();
        if (count && notifications.length > count) {
            // return only the first "count" number of notifications
            notifications.slice(0, count);
        }
        // Convert MongoDB documents to Notification objects
        const result: Notification[] = notifications.map((notification) => {
            const notObj: Notification = {
                id: notification._id.toString(),
                sender: notification.sender,
                message: notification.message,

                receiver: notification.receiver,
                type: notification.type,
                sentAt: notification.sentAt,
                data: notification.data,
                read: notification.read,
            };
            return notObj;
        });
        const response: ResponseBody = {
            message: "Notifications retrieved",
            status: ResponseStatus.GOOD,
            value: result,
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
router.put("/:notificationId", async (req: Request, res: Response) => {
    try {
        const notificationId = req.params.notificationId as string;
        const readStr = req.body.read as string | undefined;

        if (!readStr) {
            const response: ResponseBody = {
                message:
                    "Invalid body: 'status' or 'read' not updated, nothing to do",
                status: ResponseStatus.BAD,
            };
            return res.status(400).json(response);
        }
        if (readStr && ["true", "false"].indexOf(readStr) === -1) {
            const response: ResponseBody = {
                message: "Invalid body: 'read' should be 'true' or 'false'",
                status: ResponseStatus.BAD,
            };
            return res.status(400).json(response);
        }

        if (!req.user || !req.user.id) {
            const response: ResponseBody = {
                message: "User not authenticated",
                status: ResponseStatus.BAD,
            };
            return res.status(401).json(response);
        }

        const userId = req.user.id;
        const foundNotification = await NotificationSchema.findById(
            notificationId
        ).lean();

        if (!foundNotification) {
            const response: ResponseBody = {
                message: "Notification not found",
                status: ResponseStatus.BAD,
            };
            return res.status(404).json(response);
        }

        if (foundNotification.receiver.toString() !== userId) {
            const response: ResponseBody = {
                message: "Notification not found",
                status: ResponseStatus.BAD,
            };
            return res.status(404).json(response);
        }

        // Update the notification status
        foundNotification.read = readStr === "true";

        const result = await NotificationSchema.findByIdAndUpdate(
            notificationId,
            foundNotification,
            { new: true }
        );

        if (!result) {
            const response: ResponseBody = {
                message: "Notification not found",
                status: ResponseStatus.BAD,
            };
            return res.status(404).json(response);
        }

        const response: ResponseBody = {
            message: "Notification status updated",
            status: ResponseStatus.GOOD,
            value: result._id.toString(),
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
