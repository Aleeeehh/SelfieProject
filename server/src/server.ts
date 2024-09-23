import express, { Application, Request, Response } from "express";
// import express, { Request, Response, Application, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { default as apiRouter } from "./routers/api.js";

// import env file
dotenv.config();

const server: Application = express();
const PORT = process.env.PORT || 8000;

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors());
server.enable("trust proxy");

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

server.listen(PORT, () => {
	console.log("Server listening on port", PORT);
});

export default server;
