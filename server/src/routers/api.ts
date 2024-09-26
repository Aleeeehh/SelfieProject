import { default as usersRouter } from "./users.js";
import { default as eventsRouter } from "./events.js";
import { default as pomodoroRouter } from "./pomodoro.js";
import { default as notesRouter } from "./notes.js";
import { default as projectsRouter } from "./projects.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import { Request, Response, Router, NextFunction } from "express";

const router: Router = Router();

export function checkAuthentication(req: Request, res: Response, next: NextFunction) {
	// Check if session exists and if the user is logged in (custom logic)
	if (req.session && req.user) {
		// If user is authenticated, proceed to the next middleware or route
		return next();
	} else {
		// If user is not authenticated, redirect to login or return an error
		return res
			.status(401)
			.json({ status: ResponseStatus.BAD, message: "Unauthorized: Please log in" });
	}
}

router.use("/users", usersRouter);

router.use(checkAuthentication);

router.use("/events", eventsRouter);
router.use("/notes", notesRouter);
router.use("/projects", projectsRouter);
router.use("/pomodoro", pomodoroRouter);

router.get("/", (_: Request, res: Response) => {
	res.json({ message: "Hello from the server" });
});

// Catch all route
router.use("*", (_: Request, res: Response) => {
	res.json({ status: ResponseStatus.BAD, message: "Path not found" });
});

export default router;
