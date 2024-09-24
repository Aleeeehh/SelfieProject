import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { default as apiRouter } from "./routers/api.js";
import mongoose from "mongoose";
import {
	createDummyEvents,
	createDummyNotes,
	createDummyPomodoros,
	createDummyUsers,
} from "./db/populateDB.js";

// import env file
dotenv.config();

const server: Application = express();
const PORT = process.env.PORT || 8000;

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors());
server.enable("trust proxy");

// Api routes definition
server.use("/api", apiRouter);

// Serve the static React files
const __dirname = path.resolve();

server.use("/js", express.static(path.join(__dirname, "build", "js")));
server.use("/css", express.static(path.join(__dirname, "build", "css")));
server.use("/img", express.static(path.join(__dirname, "build", "media")));

server.use(express.static(path.join(__dirname, "build")));

server.get("*", (_: Request, res: Response) => {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Connect to database
// const DB_USER = "";
//const DB_PSWD = "";
const DB_HOST = "127.0.0.1";
const DB_PORT = "27017";
const DB_APP_NAME = "selfie_db";

// TODO: Use authentication for DB
// mongoose.connect(`mongodb://${DB_USER}:${DB_PSWD}@${DB_HOST}:${DB_PORT}/${DB_APP_NAME}`);
mongoose
	.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_APP_NAME}`)
	.then(() => createDummyUsers())
	.then(() => createDummyEvents())
	.then(() => createDummyNotes())
	.then(() => createDummyPomodoros());

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

// Start the server
server.listen(PORT, () => {
	console.log("Server listening on port", PORT);
});

export default server;
