import express, { Request, Response } from "express";
import NotificationSchema from "../schemas/Notification.js";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import type Notification from "../types/Notification.js";
const router = express.Router();

// Definisci l'interfaccia per il tuo oggetto di notifica

router.post("/", async (req: Request, res: Response) => {
    try {
        const message = req.body.message as string | undefined;
        const type = req.body.type as string | undefined;
        const mode = req.body.mode as string | undefined;
        const receiver = req.body.receiver as string | undefined;
        const data = req.body.data as { repeatedNotification: boolean; repeatTime: number; firstNotificationTime: number; idEventoNotificaCondiviso: string; date: Date };
        // TODO: validate body
        if (!message || !type || !mode || !receiver) {
            const response: ResponseBody = {
                message: "Invalid body: 'message', 'type', 'mode' and 'receiver' required",
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
        const sender = req.user.id;
        const newNotification: Notification = {
            data: data || {},
            sender,
            receiver,
            type,
            sentAt: new Date(),
            message,
        };
        const notification = await NotificationSchema.create(newNotification);

        const repeatedNotifications: Notification[] = [];

        const numberOfRepetitions = Math.floor(data.firstNotificationTime / data.repeatTime) - 1;
        //aggiungi altrettanti notifiche al database, se la notifica è ripetuta

        var messageRepeated = message.replace(/(\d+)(?=\s+(minuti|ore))/g, data.firstNotificationTime.toString());


        if (data.repeatedNotification) {
            console.log("OLTRE ALLA NOTIFICA STESSA, CREO ALTRETTANTE", numberOfRepetitions, "NOTIFICHE!");
            for (let i = 1; i <= numberOfRepetitions; i++) {
                // Calcola il nuovo valore di notificationTime per questa iterazione
                const notificationTime = data.firstNotificationTime - i * data.repeatTime;

                // Determina il messaggio per questa notifica
                let displayTime = notificationTime;
                let timeUnit = "minuti";

                if (notificationTime === 60) {
                    displayTime = 1; // 1 ora
                    timeUnit = "ora"; // Singolare
                } else if (notificationTime > 60 && notificationTime < 120) {
                    const remainingMinutes = notificationTime - 60; // Calcola i minuti rimanenti
                    displayTime = 1; // 1 ora
                    timeUnit = `ora e ${remainingMinutes} minuti`; // Visualizza "1 ora e X minuti"
                } else if (notificationTime >= 120) {
                    displayTime = Math.floor(notificationTime / 60); // Calcola le ore
                    timeUnit = "ore"; // Plurale
                }

                // Crea un nuovo messaggio per la notifica
                const messageForNotification = message.replace(/(\d+)(?=\s+(minuti|ore))/g, displayTime.toString())
                    .replace(/minuti|ore/, timeUnit);

                const anotherNotification: Notification = {
                    data: {
                        date: new Date(new Date(data.date).getTime() + i * data.repeatTime * 60000),
                        idEventoNotificaCondiviso: data.idEventoNotificaCondiviso,
                        repeatedNotification: false,
                        repeatTime: data.repeatTime,
                        firstNotificationTime: data.firstNotificationTime,
                    },
                    sender,
                    receiver,
                    type,
                    sentAt: new Date(),
                    message: messageForNotification,
                };
                repeatedNotifications.push(anotherNotification);
            }
        }
        else {
            console.log("NOTIFICA NON RIPETUTA");
        }


        if (repeatedNotifications.length > 0) {
            await NotificationSchema.insertMany(repeatedNotifications);
        }

        console.log("NOTIFICHE RIPETUTE:", repeatedNotifications);
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
                receiver: notification.receiver,
                type: notification.type,
                sentAt: notification.sentAt,
                data: notification.data,
                read: notification.read,
                message: notification.message,
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

router.post("/deleteNotification", async (req: Request, res: Response) => {
    try {
        const id = req.body.notification_id as string;
        console.log("ID NOTIFICA DA ELIMINARE:", id);
        const idEventoNotificaCondiviso = req.body.idEventoNotificaCondiviso as string;
        console.log("ID EVENTO NOTIFICA CONDIVISO:", idEventoNotificaCondiviso);
        await NotificationSchema.deleteMany({ data: { idEventoNotificaCondiviso } });
        const result = await NotificationSchema.deleteMany({ "data.idEventoNotificaCondiviso": idEventoNotificaCondiviso });
        console.log("NOTIFICHE ELIMINATE:", result);
    } catch (e) {
        console.log(e);
        const response: ResponseBody = {
            message: "Failed to delete notification",
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
                message: "Invalid body: 'status' or 'read' not updated, nothing to do",
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
        const foundNotification = await NotificationSchema.findById(notificationId).lean();

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

router.post("/cleanNotifications", async (req: Request, res: Response) => {
    try {
        const currentDate = new Date(req.body.currentDate); // Ricevi la data attuale dal corpo della richiesta
        const limitDate = new Date(currentDate);
        limitDate.setDate(limitDate.getDate() - 1); // Calcola la data limite (un giorno prima)

        // Trova e cancella le notifiche che soddisfano i criteri
        const result = await NotificationSchema.deleteMany({
            date: { $lt: limitDate }, // Data della notifica è minore della data limite
            read: true // Le notifiche devono essere lette
        });

        console.log("NOTIFICHE ELIMINATE:", result);

        // Rispondi con il numero di notifiche eliminate
        const response = {
            message: "Notifiche eliminate",
            deletedCount: result.deletedCount,
        };
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: "Errore durante la pulizia delle notifiche" });
    }
});
export default router;
