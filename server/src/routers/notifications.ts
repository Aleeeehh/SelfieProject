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
        const data = req.body.data as {
            repeatedNotification: boolean; repeatTime: number; firstNotificationTime: number;
            idEventoNotificaCondiviso: string; date: Date; frequencyEvent: string; isInfiniteEvent: boolean;
            repetitionsEvent: number; untilDateEvent: Date;
        };

        const activityName = message ? message.match(/Scadenza (.+?)(?: tra| iniziata)/)?.[1] : ""; // Cattura il nome dell'attività

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

        let notification: Notification;

        //Notifica base che si crea sempre
        const newNotification: Notification = {
            data: data || {},
            sender,
            receiver,
            type,
            sentAt: new Date(),
            message,
            isInfiniteEvent: data.isInfiniteEvent || false,
            frequencyEvent: data.frequencyEvent || "",
        };
        notification = await NotificationSchema.create(newNotification);
        console.log("NOTIFICA CREATA A PRESCINDERE (LA PRIMA):", newNotification);


        //se ci sono più notifiche da aggiungere
        const repeatedNotifications: Notification[] = [];
        if (data.repeatedNotification) {
            const numberOfRepetitions = Math.floor(data.firstNotificationTime / data.repeatTime) - 1;
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
                }
                else if (notificationTime === 120) {
                    displayTime = 2; // 2 ore
                    timeUnit = "ore"; // Plurale
                }

                else if (notificationTime > 60 && notificationTime < 120) {
                    const remainingMinutes = notificationTime - 60; // Calcola i minuti rimanenti
                    displayTime = 1; // 1 ora
                    timeUnit = `ora e ${remainingMinutes} minuti`; // Visualizza "1 ora e X minuti"
                } else if (notificationTime > 120) {
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
                        isInfiniteEvent: false,
                    },
                    sender,
                    receiver,
                    type,
                    sentAt: new Date(),
                    message: messageForNotification,
                };
                await NotificationSchema.create(anotherNotification);
            }
        }

        //caso in cui l'evento della notifica ha un certo numero di ripetizioni
        if (data.repetitionsEvent > 1) {
            const frequency = data.frequencyEvent; // Frequenza dell'evento
            const repetitions = data.repetitionsEvent; // Numero di ripetizioni dell'evento
            const startDate = new Date(data.date); // Data di inizio dell'evento

            for (let i = 2; i <= repetitions; i++) { //parti da 2 perchè la prima notifica è già stata creata
                let nextDate = new Date(startDate);
                // Calcola la prossima data in base alla frequenza
                switch (frequency) {
                    case "day":
                        nextDate.setDate(startDate.getDate() + (i - 1));
                        break;
                    case "week":
                        nextDate.setDate(startDate.getDate() + (i - 1) * 7);
                        break;
                    case "month":
                        nextDate.setMonth(startDate.getMonth() + (i - 1));
                        break;
                    case "year":
                        nextDate.setFullYear(startDate.getFullYear() + (i - 1));
                        break;
                    default:
                        break;
                }
                // Crea un nuovo messaggio per la notifica
                var messageForNotification = message.replace(/(\d+)(?=\s+(minuti|ore))/g, (match) => {
                    const notificationsTime = data.firstNotificationTime;

                    // Se notificationsTime è maggiore di 60, calcola ore e minuti
                    if (notificationsTime > 60) {
                        const hours = Math.floor(notificationsTime / 60);
                        const minutes = notificationsTime % 60; // Resto per ottenere i minuti
                        let result = `${hours} ${hours === 1 ? 'ora' : 'ore'}`; // Aggiungi ore

                        // Aggiungi minuti solo se sono maggiori di 0
                        if (minutes > 0) {
                            result += ` e ${minutes} minuti`;
                        }

                        return result;
                    }

                    // Se notificationsTime è 60 o meno, restituisci il valore originale
                    return notificationsTime.toString();
                });

                // Assicurati di sostituire solo il numero e non "minuti" o "ore"
                messageForNotification = messageForNotification.replace(/minuti|ore/g, (match) => {
                    return match; // Mantieni "minuti" o "ore" come sono
                });

                console.log("FIRST NOTIFICATION TIME CHE DOVREBBE ESSERE UGUALE PER TUTTI:", data.firstNotificationTime);
                console.log("MESSAGGIO DELLA NOTIFICA:", messageForNotification);

                const anotherNotification: Notification = {
                    data: {
                        date: nextDate,
                        idEventoNotificaCondiviso: data.idEventoNotificaCondiviso,
                        repeatedNotification: false,
                        repeatTime: data.repeatTime,
                        firstNotificationTime: data.firstNotificationTime,
                        isInfiniteEvent: false,
                    },
                    sender,
                    receiver,
                    type,
                    sentAt: new Date(),
                    message: messageForNotification,
                };

                await NotificationSchema.create(anotherNotification);

                if (data.repeatedNotification) {
                    const numberOfRepetitions = Math.floor(data.firstNotificationTime / data.repeatTime) - 1;
                    console.log("OLTRE ALLA NOTIFICA STESSA, CREO ALTRETTANTE", numberOfRepetitions, "NOTIFICHE!");
                    for (let j = 1; j <= numberOfRepetitions; j++) {
                        // Calcola il nuovo valore di notificationTime per questa iterazione
                        console.log("FIRSTNOTIFICATIONTIME iterazione:", j, "è", data.firstNotificationTime);
                        const notificationTime = data.firstNotificationTime - j * data.repeatTime;
                        console.log("REPEATTIME:", data.repeatTime);
                        console.log("NOTIFICATIONTIME iterazione:", j, "è", notificationTime);

                        // Determina il messaggio per questa notifica
                        let displayTime = notificationTime;
                        let timeUnit = "minuti";

                        if (notificationTime === 60) {
                            displayTime = 1; // 1 ora
                            timeUnit = "ora"; // Singolare
                        }
                        else if (notificationTime === 120) {
                            displayTime = 2; // 2 ore
                            timeUnit = "ore"; // Plurale
                        }

                        else if (notificationTime > 60 && notificationTime < 120) {
                            const remainingMinutes = notificationTime - 60; // Calcola i minuti rimanenti
                            displayTime = 1; // 1 ora
                            timeUnit = `ora e ${remainingMinutes} minuti`; // Visualizza "1 ora e X minuti"
                        } else if (notificationTime > 120) {
                            displayTime = Math.floor(notificationTime / 60); // Calcola le ore
                            timeUnit = "ore"; // Plurale
                        }

                        // Crea un nuovo messaggio per la notifica
                        const messageForNotification = message.replace(/(\d+)(?=\s+(minuti|ore))/g, displayTime.toString())
                            .replace(/minuti|ore/, timeUnit);

                        const anotherNotification: Notification = {
                            data: {
                                date: new Date(nextDate.getTime() + j * data.repeatTime * 60000),
                                idEventoNotificaCondiviso: data.idEventoNotificaCondiviso,
                                repeatedNotification: false,
                                repeatTime: data.repeatTime,
                                firstNotificationTime: data.firstNotificationTime,
                                isInfiniteEvent: false,
                            },
                            sender,
                            receiver,
                            type,
                            sentAt: new Date(),
                            message: messageForNotification,
                        };
                        await NotificationSchema.create(anotherNotification);
                    }
                }


            }
        }



        //caso in cui l'evento della notifica ha un limite di data
        if (data.untilDateEvent) {
            console.log("ENTRATO IN CASISTICA UNTIL DATE EVENT IN NOTIFICATIONS!");

            console.log("ENTRATO IN CASISTICA UNTIL DATE EVENT IN NOTIFICATIONS!");

            console.log("ENTRATO IN CASISTICA UNTIL DATE EVENT IN NOTIFICATIONS!");


            console.log("ENTRATO IN CASISTICA UNTIL DATE EVENT IN NOTIFICATIONS!");
            const untilDate = new Date(data.untilDateEvent);
            const startDate = new Date(data.date); // Data di inizio dell'evento
            const frequency = data.frequencyEvent; // Frequenza dell'evento
            //const notifications = []; // Array per le notifiche

            console.log("DATA FINO A CUI RIPETERE:", untilDate);

            // Calcola il numero di notifiche da creare
            let nextDate = new Date(startDate);
            console.log("NEXT DATE:", nextDate);
            console.log("untilDate:", untilDate);
            console.log("nextDate <= untilDate:", nextDate <= untilDate);

            switch (frequency) {
                case "day":
                    nextDate.setDate(nextDate.getDate() + 1);
                    untilDate.setDate(untilDate.getDate() + 1); //DAI SPAZIO ALLA UNTILDATE PER FARE UN'ITERAZIONE IN PIU NEL WHILE
                    break;
                case "week":
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case "month":
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    break;
                case "year":
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                    break;
                default:
                    break;
            }
            console.log("NEXT DATE DELLA SECONDA NOTIFICA:", nextDate);

            while (nextDate <= untilDate) {
                console.log("ENTRATO DENTRO AL WHILE CON DATA NEXTDATE:", nextDate);
                // Crea un nuovo messaggio per la notifica

                const messageForNotification = message.replace(/(\d+)(?=\s+(minuti|ore))/g, (match) => {
                    const notificationsTime = data.firstNotificationTime;

                    // Se notificationsTime è maggiore di 60, calcola ore e minuti
                    if (notificationsTime >= 60) {
                        const hours = Math.floor(notificationsTime / 60);
                        const minutes = notificationsTime % 60; // Resto per ottenere i minuti
                        let result = `${hours} ${hours === 1 ? 'ora' : 'ore'}`; // Aggiungi ore

                        // Aggiungi minuti solo se sono maggiori di 0
                        if (minutes > 0) {
                            result += ` e ${minutes} minuti`;
                        }

                        return result; // Restituisci il risultato formattato
                    }

                    // Se notificationsTime è 60 o meno, restituisci il valore originale con "minuti"
                    return `${notificationsTime} ${notificationsTime === 1 ? 'minuto' : 'minuti'}`;
                }).replace(/minuti|ore/g, (match) => {
                    // Mantieni "minuti" o "ore" come sono, evitando duplicati
                    return match;
                });
                console.log("MESSAGGIO ORIGINALE:", message);
                console.log("MESSAGGIO MODIFICATO:", messageForNotification);

                const anotherNotification: Notification = {
                    data: {
                        date: nextDate,
                        idEventoNotificaCondiviso: data.idEventoNotificaCondiviso,
                        repeatedNotification: false,
                        repeatTime: data.repeatTime,
                        firstNotificationTime: data.firstNotificationTime,
                        isInfiniteEvent: false,
                    },
                    sender,
                    receiver,
                    type,
                    sentAt: new Date(),
                    message: messageForNotification,
                };
                console.log("ALTRA NOTIFICA CREATA:", anotherNotification);

                await NotificationSchema.create(anotherNotification);

                if (data.repeatedNotification) {
                    const numberOfRepetitions = Math.floor(data.firstNotificationTime / data.repeatTime) - 1;
                    console.log("OLTRE ALLA NOTIFICA STESSA, CREO ALTRETTANTE", numberOfRepetitions, "NOTIFICHE!");
                    for (let j = 1; j <= numberOfRepetitions; j++) {
                        // Calcola il nuovo valore di notificationTime per questa iterazione
                        console.log("FIRSTNOTIFICATIONTIME iterazione:", j, "è", data.firstNotificationTime);
                        const notificationTime = data.firstNotificationTime - j * data.repeatTime;
                        console.log("REPEATTIME:", data.repeatTime);
                        console.log("NOTIFICATIONTIME iterazione:", j, "è", notificationTime);

                        // Determina il messaggio per questa notifica
                        let displayTime = notificationTime;
                        let timeUnit = "minuti";

                        if (notificationTime === 60) {
                            displayTime = 1; // 1 ora
                            timeUnit = "ora"; // Singolare
                        }
                        else if (notificationTime === 120) {
                            displayTime = 2; // 2 ore
                            timeUnit = "ore"; // Plurale
                        }
                        else if (notificationTime > 60 && notificationTime < 120) {
                            const remainingMinutes = notificationTime - 60; // Calcola i minuti rimanenti
                            displayTime = 1; // 1 ora
                            timeUnit = `ora e ${remainingMinutes} minuti`; // Visualizza "1 ora e X minuti"
                        } else if (notificationTime > 120) {
                            displayTime = Math.floor(notificationTime / 60); // Calcola le ore
                            timeUnit = "ore"; // Plurale
                        }

                        // Crea un nuovo messaggio per la notifica
                        const messageForNotification = message.replace(/(\d+)(?=\s+(minuti|ore))/g, displayTime.toString())
                            .replace(/minuti|ore/, timeUnit);

                        const anotherNotification: Notification = {
                            data: {
                                date: new Date(nextDate.getTime() + j * data.repeatTime * 60000),
                                idEventoNotificaCondiviso: data.idEventoNotificaCondiviso,
                                repeatedNotification: false,
                                repeatTime: data.repeatTime,
                                firstNotificationTime: data.firstNotificationTime,
                                isInfiniteEvent: false,
                            },
                            sender,
                            receiver,
                            type,
                            sentAt: new Date(),
                            message: messageForNotification,
                        };
                        await NotificationSchema.create(anotherNotification);
                    }
                }

                // Calcola la prossima data in base alla frequenza
                switch (frequency) {
                    case "day":
                        nextDate.setDate(nextDate.getDate() + 1);
                        break;
                    case "week":
                        nextDate.setDate(nextDate.getDate() + 7);
                        break;
                    case "month":
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        break;
                    case "year":
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                        break;
                    default:
                        break;
                }
            }
        }


        //aggiungi notifiche per scadenza attività
        const deadlineNotifications: Notification[] = [];
        if (type === "activity") {
            for (let i = 1; i <= 5; i++) { // Aggiungi 5 notifiche
                let displayTime: string; // Cambiato var in let
                let timeUnit: string; // Cambiato var in let

                switch (i) {
                    case 1:
                        displayTime = "1 ora..";
                        timeUnit = "ora";
                        break;
                    case 2:
                        displayTime = "12 ore..";
                        timeUnit = "ore";
                        break;
                    case 3:
                        displayTime = "1 giorno..";
                        timeUnit = "giorno";
                        break;
                    case 4:
                        displayTime = "2 giorni..";
                        timeUnit = "giorni";
                        break;
                    case 5:
                        displayTime = "3 giorni o più..";
                        timeUnit = "giorni";
                        break;
                    default:
                        displayTime = "tempo non specificato"; // Valore di default
                        timeUnit = "giorni"; // Valore di default
                }

                // Crea un nuovo messaggio per la notifica
                const messageForNotification = `Attività ${activityName} in ritardo di ${displayTime}`;
                const minutesToAdd = i === 1 ? 60 :
                    (i === 2 ? 720 :
                        (i === 3 ? 1440 :
                            (i === 4 ? 2880 :
                                (i === 5 ? 4320 : 0)))); // Aggiunto il caso per i=5


                const anotherNotification: Notification = {
                    data: {
                        date: new Date(new Date(data.date).getTime() + minutesToAdd * 60000), // Calcola la data in base all'indice
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
                deadlineNotifications.push(anotherNotification);
            }
        }

        if (repeatedNotifications.length > 0) {
            await NotificationSchema.insertMany(repeatedNotifications);
        }

        if (deadlineNotifications.length > 0) {
            await NotificationSchema.insertMany(deadlineNotifications);
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
        const userId = req.user.username;
        /*
        console.log("Questo è il user trovato:", userId);
        console.log("Questo è il user trovato:", userId);
        console.log("Questo è il user trovato:", userId);
        console.log("Questo è il user trovato:", userId);
        console.log("Questo è il user trovato:", userId);
        console.log("Questo è il user trovato:", userId);
        */
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
        /*
                console.log("Queste sono le notifiche trovate dalla find per lo user:", notifications);
                console.log("Queste sono le notifiche trovate dalla find per lo user:", notifications);
                console.log("Queste sono le notifiche trovate dalla find per lo user:", notifications);
                console.log("Queste sono le notifiche trovate dalla find per lo user:", notifications);
                console.log("Queste sono le notifiche trovate dalla find per lo user:", notifications);
                console.log("Queste sono le notifiche trovate dalla find per lo user:", notifications);
                */

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

        const userId = req.user.username;
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
        console.log("CLEAN NOTIFICATIONS");
        console.log("CLEAN NOTIFICATIONS");
        console.log("CLEAN NOTIFICATIONS");
        console.log("CLEAN NOTIFICATIONS");
        console.log("CLEAN NOTIFICATIONS");
        console.log("CLEAN NOTIFICATIONS");
        console.log("CLEAN NOTIFICATIONS");

        const currentDate = new Date(req.body.currentDate); // Ricevi la data attuale dal corpo della richiesta
        const limitDate = new Date(currentDate);
        limitDate.setDate(limitDate.getDate() - 1); // Calcola la data limite (un giorno prima)

        /*
                const result = await NotificationSchema.deleteMany({
                    date: { $lt: limitDate }, // Data della notifica è minore della data limite
                    read: true, // Le notifiche devono essere lette
                    isInfiniteEvent: { $ne: true }, // Mantieni le notifiche infinite
                    //le notifiche infinite non vanno pulite
                });
                */

        const notificationsToDelete = await NotificationSchema.find({
            date: { $lt: limitDate }, // Data della notifica è minore della data limite
            read: true, // Le notifiche devono essere lette
        });

        //non eliminare una notifica se essa è infinita
        notificationsToDelete.forEach(async (notification) => {
            if (notification.data.isInfiniteEvent === false) {
                await NotificationSchema.deleteOne({ _id: notification._id });
                console.log("NOTIFICA ELIMINATA:", notification);
            }

        });

        // Rispondi con il numero di notifiche eliminate
        const response = {
            message: "Notifiche eliminate",
            deletedCount: notificationsToDelete.length,
        };
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: "Errore durante la pulizia delle notifiche" });
    }
});
export default router;
