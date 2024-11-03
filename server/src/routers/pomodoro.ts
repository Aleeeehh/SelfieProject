import { Request, Response, Router } from "express";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import PomodoroSchema from "../schemas/Pomodoro.js";
import type Pomodoro from "../types/Pomodoro.js";
import { ObjectId } from "mongodb";
import { Types } from "mongoose";
import Notification from "../types/Notification.js";
import NotificationSchema, {
    NotificationType,
} from "../schemas/Notification.js";
import UserSchema from "../schemas/User.js";

const router: Router = Router();

router.get("/", async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            const response: ResponseBody = {
                message: "User not authenticated",
                status: ResponseStatus.BAD,
            };
            return res.status(401).json(response);
        }

        const userID = req.user.id;

        const filter = { owner: userID };
        // TODO: filter per logged user
        const foundSessions = await PomodoroSchema.find(filter).lean();

        const pomodoros = [];

        for (const session of foundSessions) {
            const newPomodoro: Pomodoro = {
                id: session._id.toString(),
                owner: session.owner?.toString() || "",
                studyTime: session.studyTime || 0,
                pauseTime: session.pauseTime || 0,
                cycles: session.cycles || 1,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            };

            pomodoros.push(newPomodoro);
        }

        // TODO: Sort pomodoro per update time

        return res.json({ status: ResponseStatus.GOOD, value: pomodoros });
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        return res.status(500).json(resBody);
    }
});

router.get("/:id", async (req: Request, res: Response) => {
    const pomodoroId = req.params.id as string;

    try {
        // TODO: validate param
        // TODO: validate body fields

        const foundPomodoro = await PomodoroSchema.findById(pomodoroId);

        if (!foundPomodoro) {
            const resBody: ResponseBody = {
                message: "Pomodoro with id " + pomodoroId + " not found!",
                status: ResponseStatus.BAD,
            };

            res.status(400).json(resBody);
        }

        console.log("Returning pomodoro: ", foundPomodoro);

        // TODO: filter the fields of the found pomodoro
        const resBody: ResponseBody = {
            status: ResponseStatus.GOOD,
            value: JSON.stringify(foundPomodoro),
        };

        res.json(resBody);
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        res.status(500).json(resBody);
    }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        // TODO: validate pomodoro input
        // TODO: validate body fields

        const studyTime = req.body.studyTime as number;
        const pauseTime = req.body.pauseTime as number;
        const cycles = req.body.cycles as number;
        const owner = req.user?.id;

        const newPomodoro = await PomodoroSchema.create({
            studyTime,
            pauseTime,
            cycles,
            owner,
        });

        console.log("Inserted pomodoro: ", newPomodoro);

        const resBody: ResponseBody = {
            message: "Pomodoro inserted into database",
            status: ResponseStatus.GOOD,
        };

        res.json(resBody);
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        res.status(500).json(resBody);
    }
});

router.put("/:id", async (req: Request, res: Response) => {
    const pomodoroId = req.params.id as string;
    const updatedPomodoro = req.body as Pomodoro;

    try {
        // TODO: validate param
        // TODO: validate body fields

        const foundPomodoro = await PomodoroSchema.findById(pomodoroId);

        if (!foundPomodoro) {
            const resBody: ResponseBody = {
                message: "Pomodoro with id " + pomodoroId + " not found!",
                status: ResponseStatus.BAD,
            };

            res.status(400).json(resBody);
        }

        console.log(
            "Updating pomodoro: ",
            foundPomodoro,
            " to ",
            updatedPomodoro
        );

        await PomodoroSchema.findByIdAndUpdate(pomodoroId, updatedPomodoro);

        // TODO: filter the fields of the found pomodoro
        const resBody: ResponseBody = {
            message: "Pomodoro updated in database",
            status: ResponseStatus.GOOD,
            value: JSON.stringify(foundPomodoro),
        };

        res.json(resBody);
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        res.status(500).json(resBody);
    }
});

router.delete("/:id", async (req: Request, res: Response) => {
    const pomodoroId = req.params.id as string;

    try {
        // TODO: validate param
        // TODO: validate body fields

        const foundPomodoro = await PomodoroSchema.findByIdAndDelete(
            pomodoroId
        );

        if (!foundPomodoro) {
            const resBody: ResponseBody = {
                message: "Pomodoro with id " + pomodoroId + " not found!",
                status: ResponseStatus.BAD,
            };

            res.status(400).json(resBody);
        }

        console.log("Deleted pomodoro: ", foundPomodoro);

        // TODO: filter the fields of the found pomodoro
        const resBody: ResponseBody = {
            message: "Pomodoro deleted from database",
            status: ResponseStatus.GOOD,
            value: JSON.stringify(foundPomodoro),
        };

        res.json(resBody);
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        res.status(500).json(resBody);
    }
});

router.post("/notifications", async (req: Request, res: Response) => {
    try {
        const receiver = req.body.receiver as string;
        const cycles = req.body.cycles as number;
        const studyTime = req.body.studyTime as number;
        const pauseTime = req.body.pauseTime as number;

        if (!receiver || !cycles || !studyTime || !pauseTime) {
            const resBody: ResponseBody = {
                message:
                    "Body non valido: servono i parametri 'receiver', 'cycles', 'studyTime' e 'pauseTime'",
                status: ResponseStatus.BAD,
            };
            return res.status(400).json(resBody);
        }

        if (!ObjectId.isValid(receiver)) {
            const resBody: ResponseBody = {
                message:
                    "'receiver' non valido: deve essre una stringa di 24 caratteri (ObjectId)",
                status: ResponseStatus.BAD,
            };
            return res.status(400).json(resBody);
        }

        const foundReceiver = await UserSchema.findById(receiver);

        if (!foundReceiver) {
            const resBody: ResponseBody = {
                message: "User with id " + receiver + " not found!",
                status: ResponseStatus.BAD,
            };
            return res.status(400).json(resBody);
        }

        if (!req.user || !req.user.id) {
            const resBody: ResponseBody = {
                message: "User not logged in!",
                status: ResponseStatus.BAD,
            };
            return res.status(400).json(resBody);
        }

        if (receiver === req.user.id) {
            const resBody: ResponseBody = {
                message: "Cannot send notification to yourself",
                status: ResponseStatus.BAD,
            };
            return res.status(400).json(resBody);
        }

        const notification: Notification = {
            id: new Types.ObjectId().toString(),
            sender: new Types.ObjectId(req.user.id),
            receiver: receiver,
            type: NotificationType.POMODORO,
            data: {
                cycles: cycles,
                studyTime: studyTime,
                pauseTime: pauseTime,
            },
            sentAt: new Date(),
        };

        await NotificationSchema.create(notification);

        const resBody: ResponseBody = {
            message: "Notification sent to user",
            status: ResponseStatus.GOOD,
        };
        return res.status(200).json(resBody);
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        return res.status(500).json(resBody);
    }
});

router.get("/notifications", async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            const resBody: ResponseBody = {
                message: "User not logged in!",
                status: ResponseStatus.BAD,
            };
            return res.status(400).json(resBody);
        }

        const foundNotifications = await NotificationSchema.find({
            receiver: req.user.id,
        }).lean();

        const notificationList: Notification[] = [];
        for (const notificationObj of foundNotifications) {
            const notification: Notification = {
                id: new ObjectId(notificationObj._id),
                sender: notificationObj.sender,
                receiver: notificationObj.receiver,
                type: notificationObj.type,
                sentAt: notificationObj.sentAt,
                data: JSON.parse(notificationObj.data),
                read: notificationObj.read,
            };

            notificationList.push(notification);
        }

        const resBody: ResponseBody = {
            message: "Found notifications",
            status: ResponseStatus.GOOD,
            value: notificationList,
        };

        return res.status(200).json(resBody);
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        return res.status(500).json(resBody);
    }
});

router.delete("/notifications/:id", async (req: Request, res: Response) => {
    try {
        const notificationId = req.params.id as string;

        if (!req.user || !req.user.id) {
            const resBody: ResponseBody = {
                message: "User not logged in!",
                status: ResponseStatus.BAD,
            };
            return res.status(400).json(resBody);
        }

        if (!ObjectId.isValid(req.params.id)) {
            const resBody: ResponseBody = {
                message: "Error handling request",
                status: ResponseStatus.BAD,
            };
            return res.status(400).json(resBody);
        }

        const foundNotification = await NotificationSchema.findById(
            notificationId
        ).lean();

        if (!foundNotification) {
            const resBody: ResponseBody = {
                message: "Notification not found",
                status: ResponseStatus.BAD,
            };
            return res.status(404).json(resBody);
        }

        if (foundNotification.receiver.toString() !== req.user.id) {
            const resBody: ResponseBody = {
                message: "Notification not found",
                status: ResponseStatus.BAD,
            };
            return res.status(404).json(resBody);
        }

        await NotificationSchema.findByIdAndDelete(notificationId);

        const resBody: ResponseBody = {
            message: "Notification deleted",
            status: ResponseStatus.GOOD,
        };
        return res.status(200).json(resBody);
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        return res.status(500).json(resBody);
    }
});

export default router;
