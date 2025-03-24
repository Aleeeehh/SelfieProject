import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { Event } from "../types/Event.js";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import EventSchema from "../schemas/Event.js";
import NotificationSchema from "../schemas/Notification.js";
import multer from "multer";
import ical from "ical";
import { validDateString } from "../lib.js";

const router: Router = Router();
const upload = multer(); // Configura multer

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
	/*
	if (hours === 0 && minutes < 5) {
		return 5; // Approssima i minuti a 5
	}
	*/
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
		// console.log(e);
		const resBody: ResponseBody = {
			message: "Error handling request",
			status: ResponseStatus.BAD,
		};

		return res.status(500).json(resBody);
	}
});

router.get("/owner", async (req: Request, res: Response) => {
	const ownerId = req.query.owner as string; //ottieni l'owner
	//  console.log("questo è l'owner passato come query:" + ownerId);

	try {
		//Controllo se l'owner è stato inserito
		if (!ownerId) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Owner è la stringa vuota",
			});
		}

		const foundDBEvents = await EventSchema.find({
			$or: [
				{ owner: ownerId }, // Condizione 1: owner è uguale a ownerId
				{ accessListAccepted: ownerId }, // Condizione 2: owner è contenuto in accessListAccepted
			],
		}).lean();

		// console.log("Eventi trovati:", foundDBEvents);

		if (foundDBEvents.length === 0) {
			const resBody: ResponseBody = {
				message: "L'evento con l'owner" + ownerId + " Non è stato trovato!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		// console.log("Eventi trovati: ", foundDBEvents);

		// TODO: filter the fields of the found event
		const resBody: ResponseBody = {
			message: "Evento ottenuto dal database",
			status: ResponseStatus.GOOD,
			value: foundDBEvents,
		};

		return res.json(resBody);
	} catch (e) {
		// console.log(e);
		const resBody: ResponseBody = {
			message: "Error handling request",
			status: ResponseStatus.BAD,
		};

		return res.status(500).json(resBody);
	}
});

router.post("/", async (req: Request, res: Response) => {
	//gestore per le richieste POST a questa route /events
	console.log("Sono entrato nella POST degli eventi");
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
			isInfinite,
			idEventoNotificaCondiviso,
			accessList,
			accessListAccepted,
			isRisorsa,
		} = req.body as Event;
		/*
				console.log("isRisorsa passato come parametro:", isRisorsa);
				console.log("isRisorsa passato come parametro:", isRisorsa);
		
				console.log("isRisorsa passato come parametro:", isRisorsa);
		
				console.log("isRisorsa passato come parametro:", isRisorsa);
				*/

		if (new Date(startTime) > new Date(endTime)) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "La data di inizio non può essere collocata dopo la data di fine!",
			});
		}

		const normalizedStartTime = new Date(startTime);
		normalizedStartTime.setHours(0, 0, 0, 0); // Imposta ore, minuti, secondi e millisecondi a zero

		const normalizedEndTime = new Date(endTime);
		normalizedEndTime.setHours(0, 0, 0, 0); // Imposta ore, minuti, secondi e millisecondi a zero
		//console.log("normalizedStartTime: ", normalizedStartTime);
		//console.log("normalizedEndTime: ", normalizedEndTime);

		if (
			normalizedStartTime.getTime() != normalizedEndTime.getTime() &&
			(repetitions > 1 || frequency !== "once")
		) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message:
					"L'evento deve avere data di inizio e di fine nello stesso giorno, se si vuole ripeterlo!",
			});
		}

		const startTimeDate = new Date(startTime);
		startTimeDate.setHours(startTimeDate.getHours());
		startTimeDate.setMinutes(
			minutesApprossimation(startTimeDate.getHours(), startTimeDate.getMinutes())
		); //approssima i minuti alla decina
		startTimeDate.setSeconds(0); // trascura i secondi
		startTimeDate.setMilliseconds(0); // trascura i millisecondi

		const endTimeDate = new Date(endTime);
		endTimeDate.setHours(endTimeDate.getHours()); // Aggiungi 2 ore
		endTimeDate.setMinutes(
			minutesApprossimation(endTimeDate.getHours(), endTimeDate.getMinutes())
		); //approssima i minuti alla decina
		endTimeDate.setSeconds(0); //trascura i secondi
		endTimeDate.setMilliseconds(0); //trascura i millisecondi

		const now = new Date();
		now.setHours(now.getHours());

		const groupId = new mongoose.Types.ObjectId().toString();
		//        console.log("questo è la frequenza:", frequency);

		if (isInfinite) {
			const event: Event = {
				id: "1",
				idEventoNotificaCondiviso,
				groupId,
				title,
				startTime: new Date(startTimeDate.getTime()),
				endTime: new Date(endTimeDate.getTime()),
				location,
				frequency,
				isInfinite,
				accessList,
				accessListAccepted,
				repetitions,
				owner,
				isRisorsa,
				recurring: true,
				createdAt: now,
				updatedAt: now,
			};
			await EventSchema.create(event);
			//   console.log("Inserted event: ", event);
		}

		if (untilDate == null && !isInfinite) {
			if (frequency === "day") {
				var startTimePrecedente = new Date(startTime);
				var endTimePrecedente = new Date(endTime);

				//caso in cui la frequenza dell'evento sia giornaliera
				for (let i = 0; i < repetitions; i++) {
					const startTime = new Date(startTimeDate.getTime() + i * 24 * 60 * 60 * 1000);
					const endTime = new Date(endTimeDate.getTime() + i * 24 * 60 * 60 * 1000);
					//console.log("endTime ad iterazione" + i + endTime);

					if (startTime.getHours() !== startTimePrecedente.getHours()) {
						startTime.setHours(startTimePrecedente.getHours());
					}

					if (endTime.getHours() !== endTimePrecedente.getHours()) {
						endTime.setHours(endTimePrecedente.getHours());
					}

					const event: Event = {
						id: new mongoose.Types.ObjectId().toString(), // Genera un ID unico per ogni evento
						groupId,
						idEventoNotificaCondiviso,
						title,
						startTime, // Aggiungi un giorno
						endTime, // Aggiungi un giorno
						repetitions,
						frequency,
						accessList,
						accessListAccepted,
						location,
						isInfinite,
						isRisorsa,
						owner,
						recurring: repetitions > 1, // Imposta ricorrente se repetitions > 1
						createdAt: now,
						updatedAt: now,
					};

					await EventSchema.create(event);
					// console.log("Inserted event: ", event);

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
						idEventoNotificaCondiviso,
						title,
						startTime,
						endTime,
						repetitions,
						isInfinite,
						frequency,
						accessList,
						accessListAccepted,
						location,
						owner,
						isRisorsa,
						recurring: repetitions > 1, // Imposta ricorrente se repetitions > 1
						createdAt: now,
						updatedAt: now,
					};

					await EventSchema.create(event);
					// console.log("Inserted event: ", event);
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
						idEventoNotificaCondiviso,
						endTime,
						repetitions,
						frequency,
						isInfinite,
						accessList,
						accessListAccepted,
						location,
						owner,
						isRisorsa,
						recurring: repetitions > 1, // Imposta ricorrente se repetitions > 1
						createdAt: now,
						updatedAt: now,
					};

					await EventSchema.create(event);
					//   console.log("Inserted event: ", event);
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
						idEventoNotificaCondiviso,
						endTime,
						repetitions,
						frequency,
						isInfinite,
						location,
						accessList,
						accessListAccepted,
						isRisorsa,
						owner,
						recurring: repetitions > 1, // Imposta ricorrente se repetitions > 1
						createdAt: now,
						updatedAt: now,
					};

					await EventSchema.create(event);
					// console.log("Inserted event: ", event);
					var startTimePrecedente = new Date(startTime);
					var endTimePrecedente = new Date(endTime);
				}
			}

			if (frequency === "once") {
				console.log("ENTRO DOVE VOLEVO ENTRARE");
				console.log("ENTRO DOVE VOLEVO ENTRARE");
				console.log("ENTRO DOVE VOLEVO ENTRARE");
				console.log("ENTRO DOVE VOLEVO ENTRARE");
				console.log("ENTRO DOVE VOLEVO ENTRARE");
				console.log("ENTRO DOVE VOLEVO ENTRARE");

				const event: Event = {
					id: "1",
					groupId,
					title,
					startTime: new Date(startTimeDate.getTime()), // Aggiungi un giorno
					endTime: new Date(endTimeDate.getTime()), // Aggiungi un giorno
					location,
					frequency,
					idEventoNotificaCondiviso,
					isInfinite,
					repetitions,
					owner,
					isRisorsa,
					recurring: false, //assumo evento non ricorrente
					accessList,
					accessListAccepted,
					createdAt: now,
					updatedAt: now,
				};

				console.log("Questo è l'evento da salvare:", event);
				await EventSchema.create(event);
				//      console.log("Inserted event: ", event);
			}
		}

		if (untilDate != null && !isInfinite) {
			// console.log("entrato in ramo untilDate diverso da null")

			if (frequency === "day") {
				//console.log("entrato in ramo day")
				var startTimePrecedente = new Date(startTime);
				var untilDateDate = new Date(untilDate);
				untilDateDate.setHours(0, 0, 0, 0);
				var endTimePrecedente = new Date(endTime);
				var normalizedEndTimePrecedente = new Date(endTimePrecedente);
				normalizedEndTimePrecedente.setHours(0, 0, 0, 0);

				if (untilDateDate < normalizedEndTimePrecedente) {
					//  console.log(untilDateDate, " è minore di ", endTimePrecedente);
				}
				if (untilDateDate > endTimePrecedente) {
					// console.log(untilDateDate, " è maggiore di ", endTimePrecedente);
				}

				//caso in cui la frequenza dell'evento sia giornaliera
				let i = 0;
				// console.log("questa è la untilDate: ", untilDate)
				// console.log("questa è la endTimePrecedente: ", endTimePrecedente)
				while (untilDateDate > normalizedEndTimePrecedente) {
					const startTime = new Date(startTimeDate.getTime() + i * 24 * 60 * 60 * 1000);
					const endTime = new Date(endTimeDate.getTime() + i * 24 * 60 * 60 * 1000);
					//console.log("endTime ad iterazione" + i + endTime);

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
						idEventoNotificaCondiviso,
						frequency,
						isInfinite,
						untilDate,
						accessList,
						accessListAccepted,
						location,
						owner,
						isRisorsa,
						recurring: true,
						createdAt: now,
						updatedAt: now,
					};

					await EventSchema.create(event);
					//("Inserted event: ", event);

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
						accessList,
						accessListAccepted,
						untilDate,
						frequency,
						idEventoNotificaCondiviso,
						isInfinite,
						location,
						owner,
						isRisorsa,
						recurring: true, // Imposta ricorrente se repetitions > 1
						createdAt: now,
						updatedAt: now,
					};

					await EventSchema.create(event);
					// console.log("Inserted event: ", event);
					var startTimePrecedente = new Date(startTime);
					var endTimePrecedente = new Date(endTime);
					normalizedEndTimePrecedente = new Date(endTime);
					normalizedEndTimePrecedente.setMonth(
						normalizedEndTimePrecedente.getMonth() + 1
					);
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
				// console.log("untilDateDate: ", untilDateDate);
				//console.log("normalizedEndTimePrecedente: ", normalizedEndTimePrecedente);
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
						idEventoNotificaCondiviso,
						frequency,
						accessList,
						accessListAccepted,
						isInfinite,
						untilDate,
						location,
						owner,
						isRisorsa,
						recurring: repetitions > 1, // Imposta ricorrente se repetitions > 1
						createdAt: now,
						updatedAt: now,
					};

					await EventSchema.create(event);
					//    console.log("Inserted event: ", event);
					var startTimePrecedente = new Date(startTime);
					var endTimePrecedente = new Date(endTime);
					normalizedEndTimePrecedente = new Date(endTime);
					normalizedEndTimePrecedente.setDate(normalizedEndTimePrecedente.getDate() + 7);
					//  console.log("untilDateDate: ", untilDateDate);
					// console.log("normalizedEndTimePrecedente: ", normalizedEndTimePrecedente);
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
						idEventoNotificaCondiviso,
						repetitions,
						frequency,
						isInfinite,
						untilDate,
						accessList,
						accessListAccepted,
						location,
						owner,
						isRisorsa,
						recurring: true, // Imposta ricorrente se repetitions > 1
						createdAt: now,
						updatedAt: now,
					};

					await EventSchema.create(event);
					//    console.log("Inserted event: ", event);
					var startTimePrecedente = new Date(startTime);
					var endTimePrecedente = new Date(endTime);
					normalizedEndTimePrecedente = new Date(endTime);
					normalizedEndTimePrecedente.setFullYear(
						normalizedEndTimePrecedente.getFullYear() + 1
					);
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
					idEventoNotificaCondiviso,
					frequency,
					accessList,
					accessListAccepted,
					isInfinite,
					repetitions,
					owner,
					isRisorsa,
					recurring: false, //assumo evento non ricorrente
					createdAt: now,
					updatedAt: now,
				};
				await EventSchema.create(event);
				// console.log("Inserted event: ", event);
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
	// console.log("Richiesta ricevuta per eliminare evento");

	const { event_id, groupId } = req.body;
	try {
		console.log("id Evento da eliminare:", event_id);
		const eventoEliminato = await EventSchema.find({
			_id: new mongoose.Types.ObjectId(event_id),
		});
		console.log("evento eliminato:", eventoEliminato);

		const eventiEliminati = await EventSchema.find({ groupId: groupId }); //trova tutti gli eventi con lo stesso groupId
		console.log("eventi da eliminare con medesimo groupId:", eventiEliminati);

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

router.post("/deleteEventTitle", async (req: Request, res: Response) => {
	// console.log("Richiesta ricevuta per eliminare evento");

	const { titoloDaEliminare } = req.body;
	try {
		console.log("titolo Evento da eliminare:", titoloDaEliminare);
		const eventoEliminato = await EventSchema.find({
			title: titoloDaEliminare,
		});
		console.log("evento eliminato:", eventoEliminato);

		await EventSchema.deleteOne({
			title: titoloDaEliminare,
		});
		//	console.log("QUESTI SONO GLI EVENTI ELIMINATI:", eventiEliminati);
		const resBody = {
			message: "Evento eliminato con successo",
			status: "success",
			value: eventoEliminato,
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
		const allEvents = await EventSchema.find({
			$or: [
				{ owner: owner }, // Condizione 1: owner è uguale a ownerId
				{ accessListAccepted: owner }, // Condizione 2: owner è contenuto in accessListAccepted
			],
		}).lean(); // .lean() per ottenere oggetti JavaScript semplici

		// Filtra gli eventi per il giorno selezionato
		const filteredEvents = allEvents.filter((event) => {
			const eventStartDate = new Date(event.startTime);
			const eventEndDate = new Date(event.endTime);
			const currentDate = new Date(selectedYear, selectedMonth, selectedDay);

			// Normalizza le date per confrontare solo giorno, mese e anno
			const normalizeDate: (date: Date) => Date = (date: Date) =>
				new Date(date.getFullYear(), date.getMonth(), date.getDate());

			const normalizedEventStartDate = normalizeDate(eventStartDate);
			const normalizedEventEndDate = normalizeDate(eventEndDate);
			const normalizedCurrentDate = normalizeDate(currentDate);

			// Controlla se l'evento è nel giorno selezionato
			const isSameDayEvent =
				normalizedCurrentDate >= normalizedEventStartDate &&
				normalizedCurrentDate <= normalizedEventEndDate;

			// Controlla se l'evento è giornaliero e infinito
			const isDailyInfiniteEvent =
				event.frequency === "day" &&
				event.isInfinite === true &&
				normalizedEventStartDate <= normalizedCurrentDate;

			const isMonthlyInfiniteEvent =
				event.frequency === "month" &&
				event.isInfinite === true &&
				normalizedEventStartDate <= normalizedCurrentDate &&
				eventStartDate.getDate() === currentDate.getDate(); //controlla se è lo stesso giorno del mese

			const isWeeklyInfiniteEvent =
				event.frequency === "week" &&
				event.isInfinite === true &&
				normalizedEventStartDate <= normalizedCurrentDate &&
				eventStartDate.getDay() === currentDate.getDay(); //controlla se è lo stesso giorno della settimana

			const isYearlyInfiniteEvent =
				event.frequency === "year" &&
				event.isInfinite === true &&
				normalizedEventStartDate <= normalizedCurrentDate &&
				eventStartDate.getDate() === currentDate.getDate() && //controlla se è lo stesso giorno del mese
				eventStartDate.getMonth() === currentDate.getMonth(); //controlla se è lo stesso mese

			// Includi l'evento se è nello stesso giorno o se è giornaliero e infinito
			return (
				isSameDayEvent ||
				isDailyInfiniteEvent ||
				isMonthlyInfiniteEvent ||
				isWeeklyInfiniteEvent ||
				isYearlyInfiniteEvent
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
	console.log("Entro nella PUT con req.body:", req.body);
	console.log("Entro nella PUT con req.params:", req.params);
	const idEventoNotificaCondiviso = req.params.id as string;
	const idEvento = req.body._id as string;
	const inputAccessListAcceptedUser = req.body.accessListAcceptedUser as string[] | undefined; // username list
	const inputEndTime = req.body.endTime as Date | undefined;
	try {
		//console.log("ENTRO NELLA PUT CON inputEndTime:", inputEndTime);
		console.log("idEvento:", idEvento);

		const foundEvents = await EventSchema.find({
			idEventoNotificaCondiviso: idEventoNotificaCondiviso,
		});

		console.log("EVENTI TROVATI:", foundEvents);

		//se entra in questo if, vuol dire che abbiamo modificato l'evento dal calendario
		if (req.body.isUpdate) {
			console.log("STO MODIFICANDO UN EVENTO");
			console.log("STO MODIFICANDO UN EVENTO");
			const updatedTitle = req.body.title;
			const updatedStartTime = req.body.startTime;
			const updatedEndTime = req.body.endTime;
			const updatedLocation = req.body.location;

			//se l'evento è ripetuto, aggiorniamo solo titolo e luogo
			if (foundEvents[0].frequency !== "once" || foundEvents[0].isInfinite || foundEvents[0].recurring || foundEvents[0].untilDate) {
				console.log("HO MODIFICATO UN EVENTO RIPETUTO");
				console.log("HO MODIFICATO UN EVENTO RIPETUTO");
				console.log("HO MODIFICATO UN EVENTO RIPETUTO");
				console.log("HO MODIFICATO UN EVENTO RIPETUTO");
				await EventSchema.updateMany(
					{ idEventoNotificaCondiviso: idEventoNotificaCondiviso },
					{
						$set: {
							title: updatedTitle,
							location: updatedLocation
						}
					}
				);
			}
			else {
				console.log("HO MODIFICATO UN EVENTO BASE");
				console.log("HO MODIFICATO UN EVENTO BASE");
				console.log("HO MODIFICATO UN EVENTO BASE");
				console.log("HO MODIFICATO UN EVENTO BASE");
				//se è un evento base, aggiorniamo tutto
				await EventSchema.updateMany(
					{
						idEventoNotificaCondiviso: idEventoNotificaCondiviso,
						isRisorsa: false
					},

					{
						title: updatedTitle,
						startTime: updatedStartTime,
						endTime: updatedEndTime,
						location: updatedLocation,
					}
				);
			}

			//guardiamo se abbiamo modificato la data di inzio dell'evento
			if (new Date(updatedStartTime).getTime() !== new Date(foundEvents[0].startTime).getTime()) {
				console.log("updatedStartTime:", updatedStartTime);
				console.log("foundEvents[0].startTime:", foundEvents[0].startTime);
				console.log("HO MODIFICATO LA DATA DI INIZIO DELL'EVENTO");
				console.log("HO MODIFICATO LA DATA DI INIZIO DELL'EVENTO");
				console.log("HO MODIFICATO LA DATA DI INIZIO DELL'EVENTO");

				//se la abbiamo modificata, guardiamo se esiste una notifica associata all'evento
				const notificheAssociata = await NotificationSchema.find({ idEventoNotificaCondiviso: idEventoNotificaCondiviso });
				console.log("notificheAssociata:", notificheAssociata);

				//se entrambe sono vere, calcoliamo la differenza tra la data originale e la data modificata
				if (notificheAssociata !== null) {
					//aggiungiamo/togliamo la differenza tra le date a tutte le notifiche associate all'evento
					//DOBBIAMO GESTIRE IL CASO IN VALORE ASSOLUTO
					for (const notifica of notificheAssociata) {
						const differenza = new Date(updatedStartTime).getTime() - new Date(foundEvents[0].startTime).getTime();
						const newDataNotifica = new Date(new Date(notifica.data.date).getTime() + differenza);
						console.log("newDataNotifica:", newDataNotifica);
						await NotificationSchema.updateOne(
							{ _id: notifica._id },
							{
								data: {
									...notifica.data,  // mantiene tutti i campi esistenti
									date: newDataNotifica  // aggiorna solo la data
								}
							});
					}

				}

				//se esistono risorse associate all'evento, aggiorniamo la data di inizio di ogni risorsa
				// cerchiamo tutti gli eventi che hanno isRisorsa = true e che hanno lo stesso idEventoNotificaCondiviso
				const risorseAssociata = await EventSchema.find({ isRisorsa: true, idEventoNotificaCondiviso: idEventoNotificaCondiviso });
				console.log("risorseAssociata:", risorseAssociata);
				for (const risorsa of risorseAssociata) {
					console.log("risorsa:", risorsa);
					//aggiorniamo la data della risorsa
					await EventSchema.updateOne(
						{ _id: risorsa._id },
						{
							$set: {
								startTime: updatedStartTime,
								endTime: updatedEndTime
							}
						}
					);


				}

			}
		}

		if (foundEvents.length === 0) {
			const resBody: ResponseBody = {
				message: "Event with id " + idEventoNotificaCondiviso + " not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		let updatedAccessListAccepted: string[] | undefined;
		if (inputAccessListAcceptedUser) {
			// Crea una lista aggiornata per accessListAccepted
			updatedAccessListAccepted = foundEvents[0].accessListAccepted?.concat(
				inputAccessListAcceptedUser
			);

			console.log("Updating events to ", updatedAccessListAccepted);

			// Aggiorna tutti gli eventi con lo stesso idEventoNotificaCondiviso
			await EventSchema.updateMany(
				{ idEventoNotificaCondiviso: idEventoNotificaCondiviso },
				{ accessListAccepted: updatedAccessListAccepted }
			);
		}
		/*
				if (inputEndTime) {
					//console.log("AGGIORNO LA ENDTIME:", inputEndTime);
					await EventSchema.updateMany(
						{ idEventoNotificaCondiviso: idEventoNotificaCondiviso },
						{ endTime: inputEndTime }
					);
				}
					*/

		// TODO: filter the fields of the found event
		const resBody: ResponseBody = {
			message: "Events updated in database",
			status: ResponseStatus.GOOD,
			value: foundEvents,
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

/* IPOTETICA PUT ULTERIORE CON IDEVENTONOTIFICACONDIVISO

router.put("/:id", async (req: Request, res: Response) => {
	const idEventoNotificaCondiviso = req.params.id as string;
	const inputAccessListAcceptedUser = req.body.accessListAcceptedUser as
		| string[]
		| undefined; // username list

	try {
		// TODO: validate param
		// TODO: validate body fields

		const foundEvents = await EventSchema.find({
			idEventoNotificaCondiviso: idEventoNotificaCondiviso,
		});

		console.log("foundEvents:", foundEvents);

		if (foundEvents.length === 0) {
			const resBody: ResponseBody = {
				message:
					"Event with id " +
					idEventoNotificaCondiviso +
					" not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		let updatedAccessListAccepted: string[] | undefined;
		if (inputAccessListAcceptedUser) {
			// Crea una lista aggiornata per accessListAccepted
			updatedAccessListAccepted = foundEvents[0].accessListAccepted?.concat(inputAccessListAcceptedUser);

			console.log("Updating events to ", updatedAccessListAccepted);

			// Aggiorna tutti gli eventi con lo stesso idEventoNotificaCondiviso
			await EventSchema.updateMany(
				{ idEventoNotificaCondiviso: idEventoNotificaCondiviso },
				{ accessListAccepted: updatedAccessListAccepted }
			);
		}

		// TODO: filter the fields of the found event
		const resBody: ResponseBody = {
			message: "Events updated in database",
			status: ResponseStatus.GOOD,
			value: foundEvents,
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
*/

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

router.get("/ical", async (req: Request, res: Response) => {
	const owner = req.query.owner as string;
	const events = await EventSchema.find({ owner: owner }).lean(); //ottengo tutti gli eventi dell'owner
	const icalEvents: { [key: string]: any } = {};
	// const ical = require('ical');

	for (const event of events) {
		// Crea l'oggetto evento iCalendar manualmente
		const icalEvent = {
			uid: event._id.toString(),
			summary: event.title,
			description: "", // Aggiungi la descrizione se disponibile
			location: event.location || "", // Aggiungi la posizione se disponibile
			start: event.startTime,
			end: event.endTime,
			// Aggiungi altri campi se necessario
		};
		icalEvents[event._id.toString()] = icalEvent;
	}
	console.log("icalEvents:", icalEvents);

	const icalString =
		`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Organization//Your Product//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
` +
		Object.keys(icalEvents)
			.map((key) => {
				const e = icalEvents[key];
				return `BEGIN:VEVENT
UID:${e.uid}
SUMMARY:${e.summary}
DESCRIPTION:${e.description}
LOCATION:${e.location}
DTSTART:${e.start.toISOString().replace(/-|:|\.\d+/g, "")}
DTEND:${e.end.toISOString().replace(/-|:|\.\d+/g, "")}
END:VEVENT`;
			})
			.join("\n") +
		"\nEND:VCALENDAR";

	res.set("Content-Type", "text/calendar");
	res.set("Content-Disposition", 'attachment; filename="calendar.ics"');
	res.send(icalString);
});

router.post(
	"/importCalendar",
	upload.single("calendarFile"),
	async (req: Request, res: Response) => {
		const icalString = req.file?.buffer.toString(); // Ottieni il contenuto del file come stringa
		const owner = req.body.owner;

		if (!icalString) {
			return res.status(400).send("Nessun file iCalendar fornito");
		}

		console.log("icalString:", icalString);

		const parsedEvents = ical.parseICS(icalString); // Usa ical per analizzare il file

		// Itera sugli eventi e salvali nel database
		for (const key in parsedEvents) {
			const event = parsedEvents[key];
			console.log("event:", event);
			if (event.type === "VEVENT") {
				const groupId = new mongoose.Types.ObjectId().toString();
				const newEvent = new EventSchema({
					uid: event.uid,
					title: event.summary,
					owner: owner,
					description: event.description || "",
					location: event.location || "",
					groupId: groupId,
					frequency: "once",
					repetitions: 1,
					startTime: event.start,
					endTime: event.end,
					// Aggiungi altri campi se necessario
				});
				await EventSchema.create(newEvent);
			}

			//await newEvent.save(); // Salva l'evento nel database
		}

		return res.status(200).send("Calendario importato con successo");
	}
);

export default router;
