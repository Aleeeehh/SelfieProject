import { Request, Response, Router } from "express";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import PomodoroSchema from "../schemas/Pomodoro.js";
import type Pomodoro from "../types/Pomodoro.js";

const router: Router = Router();

router.get("/", async (_: Request, res: Response) => {
	try {
		const filter = {};
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

        const newPomodoro = await PomodoroSchema.create({ studyTime, pauseTime, cycles, owner });
        
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

		console.log("Updating pomodoro: ", foundPomodoro, " to ", updatedPomodoro);

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

		const foundPomodoro = await PomodoroSchema.findByIdAndDelete(pomodoroId);

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

export default router;
