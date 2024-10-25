import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { Event } from "../types/Event.js";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import EventSchema from "../schemas/Event.js";
import { validDateString } from "../lib.js";
import { start } from "repl";

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
						from.getMilliseconds() >= currentDate.getMilliseconds() &&
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
						from.getMilliseconds() >= currentDate.getMilliseconds() &&
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
					if (from.getMilliseconds() >= currentDate.getMilliseconds()) {
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
						from.getMilliseconds() >= currentDate.getMilliseconds() &&
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
						from.getMilliseconds() >= currentDate.getMilliseconds() &&
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
					if (from.getMilliseconds() >= currentDate.getMilliseconds()) {
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
				console.log("L'unità è < 5, allora stampo:", (minutes - (minutes % 10)));
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
		const foundDBEvents = await EventSchema.find({ owner: req.user?.id }).lean();

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
				message: "Owner è la stringa vuota"
			});
		}

		const foundDBEvents = await EventSchema.find({ owner: ownerId }).lean();

		if (foundDBEvents.length === 0) {
			const resBody: ResponseBody = {
				message: "L'evento con l'owner" + ownerId + " Non è stato trovato!",
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

router.post("/", async (req: Request, res: Response) => { //gestore per le richieste POST a questa route /events
	try {
		//Validazione dell'input
		const { owner, title, startTime, endTime, location, repetitions } = req.body as Event;
		console.log("queste sono le ripetizioni:", repetitions);

		if (!title || !startTime || !endTime || !location) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Tutti i campi dell'evento devono essere riempiti!",
			});
		}

		if (new Date(startTime) > new Date(endTime)) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "La data di inizio non può essere collocata dopo la data di fine!",
			});
		}

		const startTimeDate = new Date(startTime);
		startTimeDate.setHours(startTimeDate.getHours());
		startTimeDate.setMinutes(minutesApprossimation(startTimeDate.getHours(), startTimeDate.getMinutes())); //approssima i minuti alla decina
		startTimeDate.setSeconds(0); // trascura i secondi
		startTimeDate.setMilliseconds(0); // trascura i millisecondi


		const endTimeDate = new Date(endTime);
		endTimeDate.setHours(endTimeDate.getHours()); // Aggiungi 2 ore
		endTimeDate.setMinutes(minutesApprossimation(endTimeDate.getHours(), endTimeDate.getMinutes())); //approssima i minuti alla decina
		endTimeDate.setSeconds(0); //trascura i secondi
		endTimeDate.setMilliseconds(0); //trascura i millisecondi

		const now = new Date();
		now.setHours(now.getHours());

		const groupId = new mongoose.Types.ObjectId().toString();

		for (let i = 0; i < repetitions; i++) {
			const event: Event = {
				id: new mongoose.Types.ObjectId().toString(), // Genera un ID unico per ogni evento
				groupId,
				title,
				startTime: new Date(startTimeDate.getTime() + i * 24 * 60 * 60 * 1000), // Aggiungi un giorno
				endTime: new Date(endTimeDate.getTime() + i * 24 * 60 * 60 * 1000), // Aggiungi un giorno
				repetitions,
				location,
				owner,
				recurring: repetitions > 1, // Imposta ricorrente se repetitions > 1
				createdAt: now,
				updatedAt: now,
			};

			await EventSchema.create(event);
			console.log("Inserted event: ", event);
		}
		/*
				const groupId = new mongoose.Types.ObjectId().toString(); //tutti gli eventi di questa ripetizione avranno lo stesso groupId
				//aggiungi per ogni ripetizione un giorno all'evento (ogni volta vai avanti di uno dal giorno dell'evento 1)
				for (let i = 0; i < repetitions; i++) {
					const event: Event = {
						id: "1",
						groupId,
						title,
						startTime: new Date(startTimeDate.getTime() + i * 24 * 60 * 60 * 1000), // Aggiungi un giorno
						endTime: new Date(endTimeDate.getTime() + i * 24 * 60 * 60 * 1000), // Aggiungi un giorno
						location,
						owner,
						recurring: false, //assumo evento non ricorrente
						createdAt: now,
						updatedAt: now,
					};
					await EventSchema.create(event);
					console.log("Inserted event: ", event);
	}
					*/



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
		const eventoEliminato = await EventSchema.find({ _id: new mongoose.Types.ObjectId(event_id) });
		console.log("evento eliminato:", eventoEliminato);

		const eventiEliminati = await EventSchema.find({ groupId: groupId }); //trova tutti gli eventi con lo stesso groupId
		console.log("eventi da eliminare con medesimo groupId:", eventiEliminati);

		await EventSchema.deleteOne({ _id: new mongoose.Types.ObjectId(event_id) });
		await EventSchema.deleteMany({ groupId: groupId }); //elimina tutti gli eventi con lo stesso groupId


		//	console.log("QUESTI SONO GLI EVENTI ELIMINATI:", eventiEliminati);
		const resBody = {
			message: "Evento eliminato con successo",
			status: "success",
			value: eventiEliminati,
		};
		console.log("Evento eliminato:", eventoEliminato);

		return res.json(resBody);

	}

	catch (e) {
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
		const filteredEvents = allEvents.filter(event => {
			const eventStartDate = new Date(event.startTime);
			const eventEndDate = new Date(event.endTime);
			const currentDate = new Date(selectedYear, selectedMonth, selectedDay);

			// Normalizza le date per confrontare solo giorno, mese e anno
			const normalizeDate: (date: Date) => Date = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

			const normalizedEventStartDate = normalizeDate(eventStartDate);
			const normalizedEventEndDate = normalizeDate(eventEndDate);
			const normalizedCurrentDate = normalizeDate(currentDate);

			return normalizedCurrentDate >= normalizedEventStartDate && normalizedCurrentDate <= normalizedEventEndDate;
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
