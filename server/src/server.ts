import express, { Request, Response, Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { default as eventsRouter } from "./routers/event";
import { default as pomodoroRouter } from "./routers/pomodoro";
import { default as projectsRouter } from "./routers/projects";

// import env file
dotenv.config();

const server: Application = express();
const PORT = process.env.PORT || 3002;

server.use(express.json());
server.use(cors());

server.get("/", (_: Request, res: Response) => {
	res.json({ message: "Hello from the server" });
});

server.use("/events", eventsRouter);
server.use("/projects", projectsRouter);
server.use("/pomodoro", pomodoroRouter);

server.post("/login", (req: Request, _: Response) => {
	const username = req.body.username;
	const password = req.body.password;

	console.log(username, password);

	// validate credentials in database
});

// Catch all route
server.use("*", (_: Request, res: Response) => {
	res.send("Path not found");
});

server.listen(PORT, () => {
	console.log("Server listening on port", PORT);
});

export default server;
