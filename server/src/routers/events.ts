import { Request, Response, Router } from "express";

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

router.get("/:id", async (req: Request, res: Response) => {
	const eventId = req.params.id as string;

	try {
		// TODO: validate param
		// TODO: validate body fields

		const foundEvent: Event | null = await EventSchema.findById(eventId);

		if (!foundEvent) {
			const resBody: ResponseBody = {
				message: "Event with id " + eventId + " not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		console.log("Returning event: ", foundEvent);

		// TODO: filter the fields of the found event
		const resBody: ResponseBody = {
			message: "Event inserted into database",
			status: ResponseStatus.GOOD,
			value: foundEvent,
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
	try {
		// TODO: validate event input
		// TODO: validate body fields
		const event: Event = req.body as Event;

		await EventSchema.create(event);
		console.log("Inserted event: ", event);

		const resBody: ResponseBody = {
			message: "Event inserted into database",
			status: ResponseStatus.GOOD,
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
