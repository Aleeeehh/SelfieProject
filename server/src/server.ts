import express, { Request, Response, Application } from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const server: Application = express();
const PORT = process.env.PORT || 3002;

server.use(express.json());
server.use(cors());

server.get("/", (_: Request, res: Response) => {
	res.json({ message: "Hello from the server" });
});

server.post("/login", (req: Request, _: Response) => {
	const username = req.body.username;
	const password = req.body.password;

	console.log(username, password);

	// validate credentials in database
});
server.listen(PORT, () => {
	console.log("Server listening on port", PORT);
});

export default server;
