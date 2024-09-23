import { Request, Response, Router } from "express";

import { Event } from "../types/Event.js";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import EventSchema from "../db/Event.js";
import { validDateString } from "../lib.js";

const router: Router = Router();

export enum Order {
	DATE = "date",
	LENGTH = "length",
	NAME = "name",
}

router.get("/", async (req: Request, res: Response) => {
	try {
		const dateFromStr = req.query.from as string;
		const dateToStr = req.query.to as string;
		// const order = req.query.order as Order;
		// if (!Object.values(Order).includes(order)) {
		// 	return res.status(400).json({
		// 		status: ResponseStatus.BAD,
		// 		message: "Invalid order: should be 'date', 'length' or 'name",
		// 	});
		// }

		var dateFrom;
		if (dateFromStr && !validDateString(dateFromStr))
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Dates must be in the format: YYYY-MM-DD",
			});
		else dateFrom = new Date(dateFromStr);

		var dateTo;
		if (dateToStr && !validDateString(dateToStr))
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Dates must be in the format: YYYY-MM-DD",
			});
		else dateTo = new Date(dateToStr);

		if (!(validDateString(dateFromStr) && validDateString(dateToStr))) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Dates must be in the format: YYYY-MM-DD",
			});
		}

		const filter: any = {}; //TODO: add userId for current user
		if (dateFrom) filter.startTime = { $gte: dateFrom };
		if (dateTo) filter.endTime = { $lte: dateTo };

		// TODO: filter per logged user
		const foundEvents = await EventSchema.find(filter);

		// switch (order) {
		// 	case Order.DATE:
		// 		foundEvents.sort((ev1, ev2) => ev1.startTime >= ev2.startTime);
		// 		break;
		// 	case Order.DATE:
		// 		break;
		// 	case Order.DATE:
		// 		break;
		// 	default:
		// 		break;
		// }

		return res.json({ status: ResponseStatus.GOOD, value: [...foundEvents] });
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
