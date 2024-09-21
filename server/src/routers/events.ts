import { Request, Response, Router } from "express";

import { Event } from "../types/Event.js";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";

const router: Router = Router();

router.get("/", (_: Request, res: Response) => {
	res.json({ message: "Hello from the event router" });
});

router.post("/", (req: Request, res: Response) => {
	try {
		const event: Event = req.body as Event;

		// TODO: insert into database new event

		console.log("Received event: ", event);

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

		res.json(resBody);
	}
});

export default router;
