import { default as eventsRouter } from "./events.js";
import { default as pomodoroRouter } from "./pomodoro.js";
import { default as projectsRouter } from "./projects.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import { Request, Response, Router } from "express";

const router: Router = Router();

router.use("/events", eventsRouter);
router.use("/projects", projectsRouter);
router.use("/pomodoro", pomodoroRouter);

router.post("/login", (req: Request, _: Response) => {
	const username = req.body.username;
	const password = req.body.password;

	console.log(username, password);

	// validate credentials in database
});

router.get("/", (_: Request, res: Response) => {
	res.json({ message: "Hello from the server" });
});

// Catch all route
router.use("*", (_: Request, res: Response) => {
	res.json({ status: ResponseStatus.BAD, message: "Path not found" });
});

export default router;
