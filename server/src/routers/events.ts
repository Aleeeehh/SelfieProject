import { Request, Response, Router } from "express";

import { Event } from "../types/Event.js";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import EventSchema from "../db/Event.js";
import { validDateString } from "../lib.js";
import moment from "moment";

const router: Router = Router();

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

		const filter: any = {}; //TODO: add userId for current user

		if (dateFrom) {
			filter.startTime = { $gte: dateFrom };
		}
		if (dateTo) {
			filter.endTime = { $lte: dateTo };
		}

		// TODO: filter per logged user
		const foundEvents = await EventSchema.find(filter).lean();

		const events = [];

		for (const event of foundEvents) {
			console.log("Creating evnet");
			const newEvent: Event = {
				id: event._id.toString(),
				owner: event.owner.toString(),
				title: event.title,
				startTime: moment(event.startTime).toDate(),
				endTime: moment(event.endTime).toDate(),
				frequency: event.frequency,
				location: event.location,
			};

			events.push(newEvent);
		}

		return res.json({ status: ResponseStatus.GOOD, value: events });
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

		const foundEvent = await EventSchema.findById(eventId);

		if (!foundEvent) {
			const resBody: ResponseBody = {
				message: "Event with id " + eventId + " not found!",
				status: ResponseStatus.BAD,
			};

			res.status(400).json(resBody);
		}

		console.log("Returning event: ", foundEvent);

		// TODO: filter the fields of the found event
		const resBody: ResponseBody = {
			message: "Event inserted into database",
			status: ResponseStatus.GOOD,
			value: JSON.stringify(foundEvent),
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
		// TODO: validate event input
		// TODO: validate body fields
		const event: Event = req.body as Event;

		await EventSchema.create(event);
		console.log("Inserted event: ", event);

		const resBody: ResponseBody = {
			message: "Event inserted into database",
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

			res.status(400).json(resBody);
		}

		console.log("Updating event: ", foundEvent, " to ", updatedEvent);

		await EventSchema.findByIdAndUpdate(eventId, updatedEvent);

		// TODO: filter the fields of the found event
		const resBody: ResponseBody = {
			message: "Event updated in database",
			status: ResponseStatus.GOOD,
			value: JSON.stringify(foundEvent),
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
			value: JSON.stringify(foundEvent),
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
