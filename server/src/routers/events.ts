import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { Event } from "../types/Event.js";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import EventSchema from "../schemas/Event.js";
import { validDateString } from "../lib.js";

const router: Router = Router();

function getEventsFromDBEvents(dbList: Event[], from: Date, to: Date): Event[] {
    const eventList: Event[] = [];

    for (const entry of dbList) {
        if (!entry.recurring) {
            eventList.push(entry);
            continue;
        }

        // case: repeat count is present
        if (entry.recurrence?.repeatCount) {
            var count = 0;
            var currentDate = entry.startTime;
            var increase;
            while (count < entry.recurrence?.repeatCount) {
                increase = 1;
                // Case: daysOfWeek
                if (entry.recurrence?.daysOfWeek) {
                    const currentDayOfWeek = currentDate.getDay(); // Get the day of the week (0 - 6)

                    // Check if the current day matches one of the weekdays in the array
                    if (
                        from.getMilliseconds() >=
                        currentDate.getMilliseconds() &&
                        entry.recurrence.daysOfWeek.includes(currentDayOfWeek)
                    ) {
                        // create a event with start and end times updated
                        const currentEvent = entry;
                        currentEvent.startTime = currentDate;
                        currentEvent.endTime = new Date(
                            currentEvent.startTime.getMilliseconds() -
                            (entry.startTime.getMilliseconds() -
                                entry.endTime.getMilliseconds())
                        );
                        eventList.push(currentEvent);
                    }
                }

                // case: daysOfMonth
                else if (entry.recurrence?.daysOfMonth) {
                    const currentDayOfMonth = currentDate.getDate();

                    // Check if the current day matches one of the weekdays in the array
                    if (
                        from.getMilliseconds() >=
                        currentDate.getMilliseconds() &&
                        entry.recurrence.daysOfMonth.includes(currentDayOfMonth)
                    ) {
                        // create a event with start and end times updated
                        const currentEvent = entry;
                        currentEvent.startTime = currentDate;
                        currentEvent.endTime = new Date(
                            currentEvent.startTime.getMilliseconds() -
                            (entry.startTime.getMilliseconds() -
                                entry.endTime.getMilliseconds())
                        );
                        eventList.push(currentEvent);
                    }
                }
                // case: daysApart
                else if (entry.recurrence.daysApart) {
                    // create a event with start and end times updated
                    if (
                        from.getMilliseconds() >= currentDate.getMilliseconds()
                    ) {
                        const currentEvent = entry;
                        currentEvent.startTime = currentDate;
                        currentEvent.endTime = new Date(
                            currentEvent.startTime.getMilliseconds() -
                            (entry.startTime.getMilliseconds() -
                                entry.endTime.getMilliseconds())
                        );
                        eventList.push(currentEvent);
                    }

                    // Move to the next considered day
                    increase = entry.recurrence.daysApart;
                } else {
                    throw new Error(
                        "Almeno uno tra 'entry.recurrence.daysOfWeek', 'entry.recurrence.daysOfMonth' e 'entry.recurrence.daysApart' deve essere non nullo."
                    );
                }

                // set the current date to the next considered date
                currentDate.setDate(currentDate.getDate() + increase);
                count++;
            }
        }
        // case: repeat until date is present
        else if (entry.recurrence?.repeatUntilDate) {
            var endDate: Date;
            if (entry.recurrence?.repeatUntilDate) {
                endDate = new Date(
                    Math.min(
                        entry.recurrence?.repeatUntilDate.getMilliseconds(),
                        to.getMilliseconds()
                    )
                );
            } else {
                endDate = to;
            }

            var currentDate = entry.startTime;
            while (currentDate.getMilliseconds() < endDate.getMilliseconds()) {
                increase = 1;
                // Case: daysOfWeek
                if (entry.recurrence?.daysOfWeek) {
                    const currentDayOfWeek = currentDate.getDay(); // Get the day of the week (0 - 6)

                    // Check if the current day matches one of the weekdays in the array
                    if (
                        from.getMilliseconds() >=
                        currentDate.getMilliseconds() &&
                        entry.recurrence.daysOfWeek.includes(currentDayOfWeek)
                    ) {
                        // create a event with start and end times updated
                        const currentEvent = entry;
                        currentEvent.startTime = currentDate;
                        currentEvent.endTime = new Date(
                            currentEvent.startTime.getMilliseconds() -
                            (entry.startTime.getMilliseconds() -
                                entry.endTime.getMilliseconds())
                        );
                        eventList.push(currentEvent);
                    }
                }
                // case: daysOfMonth
                else if (entry.recurrence?.daysOfMonth) {
                    const currentDayOfMonth = currentDate.getDate();

                    // Check if the current day matches one of the weekdays in the array
                    if (
                        from.getMilliseconds() >=
                        currentDate.getMilliseconds() &&
                        entry.recurrence.daysOfMonth.includes(currentDayOfMonth)
                    ) {
                        // create a event with start and end times updated
                        const currentEvent = entry;
                        currentEvent.startTime = currentDate;
                        currentEvent.endTime = new Date(
                            currentEvent.startTime.getMilliseconds() -
                            (entry.startTime.getMilliseconds() -
                                entry.endTime.getMilliseconds())
                        );
                        eventList.push(currentEvent);
                    }
                }
                // case: daysApart
                else if (entry.recurrence.daysApart) {
                    // Check if the current day matches one of the weekdays in the array

                    // create a event with start and end times updated
                    if (
                        from.getMilliseconds() >= currentDate.getMilliseconds()
                    ) {
                        const currentEvent = entry;
                        currentEvent.startTime = currentDate;
                        currentEvent.endTime = new Date(
                            currentEvent.startTime.getMilliseconds() -
                            (entry.startTime.getMilliseconds() -
                                entry.endTime.getMilliseconds())
                        );
                        eventList.push(currentEvent);
                    }

                    // Move to the next day
                    increase = entry.recurrence.daysApart;
                } else {
                    throw new Error(
                        "Almeno uno tra 'entry.recurrence.daysOfWeek', 'entry.recurrence.daysOfMonth' e 'entry.recurrence.daysApart' deve essere non nullo."
                    );
                }

                currentDate.setDate(currentDate.getDate() + increase);
            }
        }
    }

    return eventList;
}

function minutesApprossimation(hours: number, minutes: number): number {
    if (hours > 21) {
        minutes = Math.floor(minutes / 10) * 10; // Approssima per difetto
    } else {
        if (minutes % 10 === 0) {
            return minutes;
        } else {
            if (minutes % 10 < 5) {
                //console.log("L'unità è < 5, allora stampo:", (minutes - (minutes % 10)));
                minutes = minutes - (minutes % 10);
            } else {
                minutes = minutes + (10 - (minutes % 10));
            }
        }
    }
    return minutes;
}

router.get("/", async (req: Request, res: Response) => {
    try {
        const dateFromStr = req.query.from as string | undefined;
        const dateToStr = req.query.to as string | undefined;

        var dateFrom = null;
        if (dateFromStr && !validDateString(dateFromStr))
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Dates must be in the format: YYYY-MM-DD",
            });
        else if (dateFromStr) dateFrom = new Date(dateFromStr);

        var dateTo = null;
        if (dateToStr && !validDateString(dateToStr))
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Dates must be in the format: YYYY-MM-DD",
            });
        else if (dateToStr) dateTo = new Date(dateToStr);

        // TODO: filter per logged user
        const foundDBEvents = await EventSchema.find({
            owner: req.user?.id,
        }).lean();

        // change the _id property of mongoDB into id property of events
        const convertedEvents: Event[] = foundDBEvents.map((ev) => {
            const { _id, owner, ...body } = { ...ev };
            return { id: _id.toString(), owner: owner.toString(), ...body };
        });

        const currDate = new Date();
        const date30DaysFromNow: Date = currDate;
        date30DaysFromNow.setDate(currDate.getDate() + 30);

        const eventList = getEventsFromDBEvents(
            convertedEvents,
            dateFrom || currDate,
            dateTo || date30DaysFromNow
        );

        return res.json({ status: ResponseStatus.GOOD, value: eventList });
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        return res.status(500).json(resBody);
    }
});

router.get("/owner", async (req: Request, res: Response) => {
    const ownerId = req.query.owner as string; //ottieni l'owner
    console.log("questo è l'owner passato come query:" + ownerId);

    try {
        //Controllo se l'owner è stato inserito
        if (!ownerId) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Owner è la stringa vuota",
            });
        }

        const foundDBEvents = await EventSchema.find({ owner: ownerId }).lean();

        if (foundDBEvents.length === 0) {
            const resBody: ResponseBody = {
                message:
                    "L'evento con l'owner" + ownerId + " Non è stato trovato!",
                status: ResponseStatus.BAD,
            };

            return res.status(400).json(resBody);
        }

        console.log("Eventi trovati: ", foundDBEvents);

        // TODO: filter the fields of the found event
        const resBody: ResponseBody = {
            message: "Evento ottenuto dal database",
            status: ResponseStatus.GOOD,
            value: foundDBEvents,
        };

        return res.json(resBody);
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        return res.status(500).json(resBody);
    }
});

router.post("/", async (req: Request, res: Response) => {
    //gestore per le richieste POST a questa route /events
    try {
        //Validazione dell'input
        const {
            owner,
            title,
            startTime,
            untilDate,
            endTime,
            frequency,
            location,
            repetitions,
        } = req.body as Event;
        console.log("queste sono le ripetizioni:", repetitions);
        console.log("questo è l'untilDate dell'evento:", untilDate);

        if (!title || !startTime || !endTime || !location) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Tutti i campi dell'evento devono essere riempiti!",
            });
        }

        if (new Date(startTime) > new Date(endTime)) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message:
                    "La data di inizio non può essere collocata dopo la data di fine!",
            });
        }

        const normalizedStartTime = new Date(startTime);
        normalizedStartTime.setHours(0, 0, 0, 0); // Imposta ore, minuti, secondi e millisecondi a zero

        const normalizedEndTime = new Date(endTime);
        normalizedEndTime.setHours(0, 0, 0, 0); // Imposta ore, minuti, secondi e millisecondi a zero
        console.log("normalizedStartTime: ", normalizedStartTime);
        console.log("normalizedEndTime: ", normalizedEndTime);

        if (normalizedStartTime.getTime() != normalizedEndTime.getTime() && (repetitions > 1 || frequency !== "once")) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "L'evento deve avere data di inizio e di fine nello stesso giorno, se si vuole ripeterlo!",
            });
        }

        const startTimeDate = new Date(startTime);
        startTimeDate.setHours(startTimeDate.getHours());
        startTimeDate.setMinutes(
            minutesApprossimation(
                startTimeDate.getHours(),
                startTimeDate.getMinutes()
            )
        ); //approssima i minuti alla decina
        startTimeDate.setSeconds(0); // trascura i secondi
        startTimeDate.setMilliseconds(0); // trascura i millisecondi

        const endTimeDate = new Date(endTime);
        endTimeDate.setHours(endTimeDate.getHours()); // Aggiungi 2 ore
        endTimeDate.setMinutes(
            minutesApprossimation(
                endTimeDate.getHours(),
                endTimeDate.getMinutes()
            )
        ); //approssima i minuti alla decina
        endTimeDate.setSeconds(0); //trascura i secondi
        endTimeDate.setMilliseconds(0); //trascura i millisecondi

        const now = new Date();
        now.setHours(now.getHours());

        const groupId = new mongoose.Types.ObjectId().toString();
        console.log("questo è la frequenza:", frequency);

        if (untilDate == null) {
            if (frequency === "day") {
                var startTimePrecedente = new Date(startTime);
                var endTimePrecedente = new Date(endTime);

                //caso in cui la frequenza dell'evento sia giornaliera
                for (let i = 0; i < repetitions; i++) {
                    const startTime = new Date(
                        startTimeDate.getTime() + i * 24 * 60 * 60 * 1000
                    );
                    const endTime = new Date(
                        endTimeDate.getTime() + i * 24 * 60 * 60 * 1000
                    );

                    if (startTime.getHours() !== startTimePrecedente.getHours()) {
                        startTime.setHours(startTimePrecedente.getHours());
                    }

                    if (endTime.getHours() !== endTimePrecedente.getHours()) {
                        endTime.setHours(endTimePrecedente.getHours());
                    }

                    const event: Event = {
                        id: new mongoose.Types.ObjectId().toString(), // Genera un ID unico per ogni evento
                        groupId,
                        title,
                        startTime, // Aggiungi un giorno
                        endTime, // Aggiungi un giorno
                        repetitions,
                        frequency,
                        location,
                        owner,
                        recurring: repetitions > 1, // Imposta ricorrente se repetitions > 1
                        createdAt: now,
                        updatedAt: now,
                    };

                    await EventSchema.create(event);
                    console.log("Inserted event: ", event);

                    var startTimePrecedente = new Date(startTime);
                    var endTimePrecedente = new Date(endTime);
                }
            }
            if (frequency === "month") {
                var startTimePrecedente = new Date(startTime);
                var endTimePrecedente = new Date(endTime);
                for (let i = 0; i < repetitions; i++) {
                    const startTime = new Date(startTimeDate);
                    const endTime = new Date(endTimeDate);

                    // Aggiungi mesi usando i metodi UTC
                    startTime.setUTCMonth(startTime.getUTCMonth() + i);
                    endTime.setUTCMonth(endTime.getUTCMonth() + i);

                    if (startTime.getHours() !== startTimePrecedente.getHours()) {
                        startTime.setHours(startTimePrecedente.getHours());
                    }

                    if (endTime.getHours() !== endTimePrecedente.getHours()) {
                        endTime.setHours(endTimePrecedente.getHours());
                    }

                    // Controlla se il giorno è stato modificato a causa del rollover del mese
                    if (startTime.getUTCDate() !== startTimeDate.getUTCDate()) {
                        // Se il giorno è cambiato, imposta il giorno all'ultimo giorno del mese precedente
                        startTime.setUTCDate(0);
                    }
                    if (endTime.getUTCDate() !== endTimeDate.getUTCDate()) {
                        // Se il giorno è cambiato, imposta il giorno all'ultimo giorno del mese precedente
                        endTime.setUTCDate(0);
                    }

                    const event: Event = {
                        id: new mongoose.Types.ObjectId().toString(), // Genera un ID unico per ogni evento
                        groupId,
                        title,
                        startTime,
                        endTime,
                        repetitions,
                        frequency,
                        location,
                        owner,
                        recurring: repetitions > 1, // Imposta ricorrente se repetitions > 1
                        createdAt: now,
                        updatedAt: now,
                    };

                    await EventSchema.create(event);
                    console.log("Inserted event: ", event);
                    var startTimePrecedente = new Date(startTime);
                    var endTimePrecedente = new Date(endTime);
                }
            }

            if (frequency === "week") {
                var startTimePrecedente = new Date(startTime);
                var endTimePrecedente = new Date(endTime);
                for (let i = 0; i < repetitions; i++) {
                    const startTime = new Date(startTimeDate);
                    const endTime = new Date(endTimeDate);

                    if (startTime.getHours() !== startTimePrecedente.getHours()) {
                        startTime.setHours(startTimePrecedente.getHours());
                    }

                    if (endTime.getHours() !== endTimePrecedente.getHours()) {
                        endTime.setHours(endTimePrecedente.getHours());
                    }

                    // Aggiungi settimane usando i metodi UTC
                    startTime.setUTCDate(startTime.getUTCDate() + i * 7);
                    endTime.setUTCDate(endTime.getUTCDate() + i * 7);
                    const event: Event = {
                        id: new mongoose.Types.ObjectId().toString(), // Genera un ID unico per ogni evento
                        groupId,
                        title,
                        startTime,
                        endTime,
                        repetitions,
                        frequency,
                        location,
                        owner,
                        recurring: repetitions > 1, // Imposta ricorrente se repetitions > 1
                        createdAt: now,
                        updatedAt: now,
                    };

                    await EventSchema.create(event);
                    console.log("Inserted event: ", event);
                    var startTimePrecedente = new Date(startTime);
                    var endTimePrecedente = new Date(endTime);
                }
            }

            if (frequency === "year") {
                var startTimePrecedente = new Date(startTimeDate);
                var endTimePrecedente = new Date(endTimeDate);
                for (let i = 0; i < repetitions; i++) {
                    const startTime = new Date(startTimeDate);
                    const endTime = new Date(endTimeDate);

                    if (startTime.getHours() !== startTimePrecedente.getHours()) {
                        startTime.setHours(startTimePrecedente.getHours());
                    }

                    if (endTime.getHours() !== endTimePrecedente.getHours()) {
                        endTime.setHours(endTimePrecedente.getHours());
                    }

                    // Aggiungi anni usando i metodi UTC
                    startTime.setUTCFullYear(startTime.getUTCFullYear() + i);
                    endTime.setUTCFullYear(endTime.getUTCFullYear() + i);

                    // Controlla se il giorno è stato modificato a causa del rollover dell'anno
                    if (startTime.getUTCDate() !== startTimeDate.getUTCDate()) {
                        // Se il giorno è cambiato, imposta il giorno all'ultimo giorno del mese precedente
                        startTime.setUTCDate(0);
                    }
                    if (endTime.getUTCDate() !== endTimeDate.getUTCDate()) {
                        // Se il giorno è cambiato, imposta il giorno all'ultimo giorno del mese precedente
                        endTime.setUTCDate(0);
                    }

                    const event: Event = {
                        id: new mongoose.Types.ObjectId().toString(), // Genera un ID unico per ogni evento
                        groupId,
                        title,
                        startTime,
                        endTime,
                        repetitions,
                        frequency,
                        location,
                        owner,
                        recurring: repetitions > 1, // Imposta ricorrente se repetitions > 1
                        createdAt: now,
                        updatedAt: now,
                    };

                    await EventSchema.create(event);
                    console.log("Inserted event: ", event);
                    var startTimePrecedente = new Date(startTime);
                    var endTimePrecedente = new Date(endTime);
                }
            }

            if (frequency === "once") {
                const event: Event = {
                    id: "1",
                    groupId,
                    title,
                    startTime: new Date(startTimeDate.getTime()), // Aggiungi un giorno
                    endTime: new Date(endTimeDate.getTime()), // Aggiungi un giorno
                    location,
                    frequency,
                    repetitions,
                    owner,
                    recurring: false, //assumo evento non ricorrente
                    createdAt: now,
                    updatedAt: now,
                };
                await EventSchema.create(event);
                console.log("Inserted event: ", event);
            }
        }

        if (untilDate != null) {
            console.log("entrato in ramo untilDate diverso da null")

            if (frequency === "day") {
                console.log("entrato in ramo day")
                var startTimePrecedente = new Date(startTime);
                var untilDateDate = new Date(untilDate);
                untilDateDate.setHours(0, 0, 0, 0);
                var endTimePrecedente = new Date(endTime);
                var normalizedEndTimePrecedente = new Date(endTimePrecedente);
                normalizedEndTimePrecedente.setHours(0, 0, 0, 0);

                if (untilDateDate < normalizedEndTimePrecedente) {
                    console.log(untilDateDate, " è minore di ", endTimePrecedente);
                }
                if (untilDateDate > endTimePrecedente) {
                    console.log(untilDateDate, " è maggiore di ", endTimePrecedente);
                }

                //caso in cui la frequenza dell'evento sia giornaliera
                let i = 0;
                console.log("questa è la untilDate: ", untilDate)
                console.log("questa è la endTimePrecedente: ", endTimePrecedente)
                while (untilDateDate > normalizedEndTimePrecedente) {

                    const startTime = new Date(
                        startTimeDate.getTime() + i * 24 * 60 * 60 * 1000
                    );
                    const endTime = new Date(
                        endTimeDate.getTime() + i * 24 * 60 * 60 * 1000
                    );
                    console.log("endTime ad iterazione" + i + endTime);

                    if (startTime.getHours() !== startTimePrecedente.getHours()) {
                        startTime.setHours(startTimePrecedente.getHours());
                    }

                    if (endTime.getHours() !== endTimePrecedente.getHours()) {
                        endTime.setHours(endTimePrecedente.getHours());
                    }

                    const event: Event = {
                        id: new mongoose.Types.ObjectId().toString(), // Genera un ID unico per ogni evento
                        groupId,
                        title,
                        startTime, // Aggiungi un giorno
                        endTime, // Aggiungi un giorno
                        repetitions,
                        frequency,
                        untilDate,
                        location,
                        owner,
                        recurring: true,
                        createdAt: now,
                        updatedAt: now,
                    };

                    await EventSchema.create(event);
                    console.log("Inserted event: ", event);

                    startTimePrecedente = new Date(startTime);
                    endTimePrecedente = new Date(endTime);
                    normalizedEndTimePrecedente = new Date(endTime);
                    normalizedEndTimePrecedente.setHours(0, 0, 0, 0);

                    i++; // Incrementa l'indice per il prossimo ciclo
                }
            }
            if (frequency === "month") {
                var startTimePrecedente = new Date(startTime);
                var endTimePrecedente = new Date(endTime);
                var untilDateDate = new Date(untilDate);
                untilDateDate.setHours(0, 0, 0, 0);
                var normalizedEndTimePrecedente = new Date(endTimePrecedente);
                normalizedEndTimePrecedente.setHours(0, 0, 0, 0);

                let i = 0;
                while (untilDateDate > normalizedEndTimePrecedente) {
                    const startTime = new Date(startTimeDate);
                    const endTime = new Date(endTimeDate);

                    // Aggiungi mesi usando i metodi UTC
                    startTime.setUTCMonth(startTime.getUTCMonth() + i);
                    endTime.setUTCMonth(endTime.getUTCMonth() + i);

                    if (startTime.getHours() !== startTimePrecedente.getHours()) {
                        startTime.setHours(startTimePrecedente.getHours());
                    }

                    if (endTime.getHours() !== endTimePrecedente.getHours()) {
                        endTime.setHours(endTimePrecedente.getHours());
                    }

                    // Controlla se il giorno è stato modificato a causa del rollover del mese
                    if (startTime.getUTCDate() !== startTimeDate.getUTCDate()) {
                        // Se il giorno è cambiato, imposta il giorno all'ultimo giorno del mese precedente
                        startTime.setUTCDate(0);
                    }
                    if (endTime.getUTCDate() !== endTimeDate.getUTCDate()) {
                        // Se il giorno è cambiato, imposta il giorno all'ultimo giorno del mese precedente
                        endTime.setUTCDate(0);
                    }

                    const event: Event = {
                        id: new mongoose.Types.ObjectId().toString(), // Genera un ID unico per ogni evento
                        groupId,
                        title,
                        startTime,
                        endTime,
                        repetitions,
                        untilDate,
                        frequency,
                        location,
                        owner,
                        recurring: true, // Imposta ricorrente se repetitions > 1
                        createdAt: now,
                        updatedAt: now,
                    };

                    await EventSchema.create(event);
                    console.log("Inserted event: ", event);
                    var startTimePrecedente = new Date(startTime);
                    var endTimePrecedente = new Date(endTime);
                    normalizedEndTimePrecedente = new Date(endTime);
                    normalizedEndTimePrecedente.setMonth(normalizedEndTimePrecedente.getMonth() + 1);
                    normalizedEndTimePrecedente.setHours(0, 0, 0, 0);

                    i++;
                }
            }

            if (frequency === "week") {
                var startTimePrecedente = new Date(startTime);
                var endTimePrecedente = new Date(endTime);
                var untilDateDate = new Date(untilDate);
                untilDateDate.setHours(0, 0, 0, 0);
                var normalizedEndTimePrecedente = new Date(endTimePrecedente);
                //normalizedEndTimePrecedente.setDate(normalizedEndTimePrecedente.getDate() + 7);
                normalizedEndTimePrecedente.setHours(0, 0, 0, 0);
                console.log("untilDateDate: ", untilDateDate);
                console.log("normalizedEndTimePrecedente: ", normalizedEndTimePrecedente);
                let i = 0;
                while (untilDateDate > normalizedEndTimePrecedente) {
                    const startTime = new Date(startTimeDate);
                    const endTime = new Date(endTimeDate);

                    if (startTime.getHours() !== startTimePrecedente.getHours()) {
                        startTime.setHours(startTimePrecedente.getHours());
                    }

                    if (endTime.getHours() !== endTimePrecedente.getHours()) {
                        endTime.setHours(endTimePrecedente.getHours());
                    }

                    // Aggiungi settimane usando i metodi UTC
                    startTime.setUTCDate(startTime.getUTCDate() + i * 7);
                    endTime.setUTCDate(endTime.getUTCDate() + i * 7);
                    const event: Event = {
                        id: new mongoose.Types.ObjectId().toString(), // Genera un ID unico per ogni evento
                        groupId,
                        title,
                        startTime,
                        endTime,
                        repetitions,
                        frequency,
                        untilDate,
                        location,
                        owner,
                        recurring: repetitions > 1, // Imposta ricorrente se repetitions > 1
                        createdAt: now,
                        updatedAt: now,
                    };

                    await EventSchema.create(event);
                    console.log("Inserted event: ", event);
                    var startTimePrecedente = new Date(startTime);
                    var endTimePrecedente = new Date(endTime);
                    normalizedEndTimePrecedente = new Date(endTime);
                    normalizedEndTimePrecedente.setDate(normalizedEndTimePrecedente.getDate() + 7);
                    console.log("untilDateDate: ", untilDateDate);
                    console.log("normalizedEndTimePrecedente: ", normalizedEndTimePrecedente);
                    normalizedEndTimePrecedente.setHours(0, 0, 0, 0);

                    i++;
                }
            }

            if (frequency === "year") {
                var startTimePrecedente = new Date(startTimeDate);
                var endTimePrecedente = new Date(endTimeDate);
                var untilDateDate = new Date(untilDate);
                untilDateDate.setHours(0, 0, 0, 0);
                var normalizedEndTimePrecedente = new Date(endTimePrecedente);
                normalizedEndTimePrecedente.setHours(0, 0, 0, 0);
                let i = 0;
                while (untilDateDate > normalizedEndTimePrecedente) {
                    const startTime = new Date(startTimeDate);
                    const endTime = new Date(endTimeDate);

                    if (startTime.getHours() !== startTimePrecedente.getHours()) {
                        startTime.setHours(startTimePrecedente.getHours());
                    }

                    if (endTime.getHours() !== endTimePrecedente.getHours()) {
                        endTime.setHours(endTimePrecedente.getHours());
                    }

                    // Aggiungi anni usando i metodi UTC
                    startTime.setUTCFullYear(startTime.getUTCFullYear() + i);
                    endTime.setUTCFullYear(endTime.getUTCFullYear() + i);

                    // Controlla se il giorno è stato modificato a causa del rollover dell'anno
                    if (startTime.getUTCDate() !== startTimeDate.getUTCDate()) {
                        // Se il giorno è cambiato, imposta il giorno all'ultimo giorno del mese precedente
                        startTime.setUTCDate(0);
                    }
                    if (endTime.getUTCDate() !== endTimeDate.getUTCDate()) {
                        // Se il giorno è cambiato, imposta il giorno all'ultimo giorno del mese precedente
                        endTime.setUTCDate(0);
                    }

                    const event: Event = {
                        id: new mongoose.Types.ObjectId().toString(), // Genera un ID unico per ogni evento
                        groupId,
                        title,
                        startTime,
                        endTime,
                        repetitions,
                        frequency,
                        untilDate,
                        location,
                        owner,
                        recurring: true, // Imposta ricorrente se repetitions > 1
                        createdAt: now,
                        updatedAt: now,
                    };

                    await EventSchema.create(event);
                    console.log("Inserted event: ", event);
                    var startTimePrecedente = new Date(startTime);
                    var endTimePrecedente = new Date(endTime);
                    normalizedEndTimePrecedente = new Date(endTime);
                    normalizedEndTimePrecedente.setFullYear(normalizedEndTimePrecedente.getFullYear() + 1);
                    normalizedEndTimePrecedente.setHours(0, 0, 0, 0);

                    i++;
                }
            }

            if (frequency === "once") {
                const event: Event = {
                    id: "1",
                    groupId,
                    title,
                    startTime: new Date(startTimeDate.getTime()), // Aggiungi un giorno
                    endTime: new Date(endTimeDate.getTime()), // Aggiungi un giorno
                    untilDate,
                    location,
                    frequency,
                    repetitions,
                    owner,
                    recurring: false, //assumo evento non ricorrente
                    createdAt: now,
                    updatedAt: now,
                };
                await EventSchema.create(event);
                console.log("Inserted event: ", event);
            }

        }

        const resBody: ResponseBody = {
            message: "Events inserted into database",
            status: ResponseStatus.GOOD,
            value: `Inserted ${repetitions} events`,
        };
        return res.json(resBody);
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        return res.status(500).json(resBody);
    }
});

router.post("/deleteEvent", async (req: Request, res: Response) => {
    console.log("Richiesta ricevuta per eliminare evento");

    const { event_id, groupId } = req.body;
    try {
        console.log("id Evento da eliminare:", event_id);
        const eventoEliminato = await EventSchema.find({
            _id: new mongoose.Types.ObjectId(event_id),
        });
        console.log("evento eliminato:", eventoEliminato);

        const eventiEliminati = await EventSchema.find({ groupId: groupId }); //trova tutti gli eventi con lo stesso groupId
        console.log(
            "eventi da eliminare con medesimo groupId:",
            eventiEliminati
        );

        await EventSchema.deleteOne({
            _id: new mongoose.Types.ObjectId(event_id),
        });
        await EventSchema.deleteMany({ groupId: groupId }); //elimina tutti gli eventi con lo stesso groupId

        //	console.log("QUESTI SONO GLI EVENTI ELIMINATI:", eventiEliminati);
        const resBody = {
            message: "Evento eliminato con successo",
            status: "success",
            value: eventiEliminati,
        };
        console.log("Evento eliminato:", eventoEliminato);

        return res.json(resBody);
    } catch (e) {
        const resBody = {
            message: "Errore nell'eliminazione dell'evento",
            status: ResponseStatus.BAD,
        };
        return res.json(resBody);
    }
});

//INEFFICIENTE MA FUNZIONANTE, DA OTTIMIZZARE!
//TROVA GLI EVENTI DEL GIORNO SOLO PER L'OWNER PASSATO COME QUERY (utente loggato)
router.post("/eventsOfDay", async (req: Request, res: Response) => {
    const { date, owner } = req.body;

    const giornoSelezionato = new Date(date);
    const selectedDay = giornoSelezionato.getDate(); // Ottieni il giorno del mese
    const selectedMonth = giornoSelezionato.getMonth(); // Ottieni il mese
    const selectedYear = giornoSelezionato.getFullYear(); // Ottieni l'anno

    try {
        // Trova tutti gli eventi
        const allEvents = await EventSchema.find({ owner: owner }).lean(); // .lean() per ottenere oggetti JavaScript semplici

        // Filtra gli eventi per il giorno selezionato
        const filteredEvents = allEvents.filter((event) => {
            const eventStartDate = new Date(event.startTime);
            const eventEndDate = new Date(event.endTime);
            const currentDate = new Date(
                selectedYear,
                selectedMonth,
                selectedDay
            );

            // Normalizza le date per confrontare solo giorno, mese e anno
            const normalizeDate: (date: Date) => Date = (date: Date) =>
                new Date(date.getFullYear(), date.getMonth(), date.getDate());

            const normalizedEventStartDate = normalizeDate(eventStartDate);
            const normalizedEventEndDate = normalizeDate(eventEndDate);
            const normalizedCurrentDate = normalizeDate(currentDate);

            return (
                normalizedCurrentDate >= normalizedEventStartDate &&
                normalizedCurrentDate <= normalizedEventEndDate
            );
        });

        const resBody = {
            message: "Eventi filtrati per il giorno selezionato",
            status: "success",
            value: filteredEvents,
        };

        return res.json(resBody);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: ResponseStatus.BAD,
            message: "Errore durante la ricerca degli eventi.",
        });
    }
});

router.put("/:id", async (req: Request, res: Response) => {
    const eventId = req.params.id as string;
    const updatedEvent = req.body as Event;

    try {
        // TODO: validate param
        // TODO: validate body fields

        const foundEvent = await EventSchema.findById(eventId);

        if (!foundEvent) {
            const resBody: ResponseBody = {
                message: "Event with id " + eventId + " not found!",
                status: ResponseStatus.BAD,
            };

            return res.status(400).json(resBody);
        }

        console.log("Updating event: ", foundEvent, " to ", updatedEvent);

        await EventSchema.findByIdAndUpdate(eventId, updatedEvent);

        // TODO: filter the fields of the found event
        const resBody: ResponseBody = {
            message: "Event updated in database",
            status: ResponseStatus.GOOD,
            value: updatedEvent,
        };

        return res.json(resBody);
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        return res.status(500).json(resBody);
    }
});

router.delete("/:id", async (req: Request, res: Response) => {
    const eventId = req.params.id as string;

    try {
        // TODO: validate param
        // TODO: validate body fields

        const foundEvent = await EventSchema.findByIdAndDelete(eventId);

        if (!foundEvent) {
            const resBody: ResponseBody = {
                message: "Event with id " + eventId + " not found!",
                status: ResponseStatus.BAD,
            };

            res.status(400).json(resBody);
        }

        console.log("Deleted event: ", foundEvent);

        // TODO: filter the fields of the found event
        const resBody: ResponseBody = {
            message: "Event deleted from database",
            status: ResponseStatus.GOOD,
            value: foundEvent,
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

export default router;
