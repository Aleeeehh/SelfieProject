import { Request, Response, Router } from "express";

import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import UserSchema from "../db/User.js";
import { validDateString } from "../lib.js";
import User from "../types/User.js";

const router: Router = Router();

router.get("/", (_: Request, res: Response) => {
	// TODO: get the current user information (when passport is integrated)
	// return res.json({ ...res.user });
	res.json({ message: "Hello from the users router" });
});

router.post("/register", async (req: Request, res: Response) => {
	try {
		// TODO: validate body parameters
		// TODO: password hashing in database

		const username = req.body.username;
		const password = req.body.password;
		const firstName = req.body.firstName;
		const lastName = req.body.lastName;
		const birthdayStr = req.body.birthday;
		if (!validDateString(birthdayStr))
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid date format, should be: YYYY-MM-DD",
			});

		const birthday = new Date(birthdayStr);

		if (!(username || password || firstName || lastName))
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message:
					"Invalid body: 'username', 'password', 'firstName' and 'lastName' required",
			});

		const newUser: User = {
			id: "",
			username,
			password,
			firstName,
			lastName,
			birthday,
		};

		// Verify username not already used
		const foundUser = await UserSchema.findOne({ username: username });

		if (foundUser) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "User with that username already exists",
			});
		}

		// Insert into database new event
		console.log("Inserting user: ", newUser);
		await UserSchema.create(newUser);

		const resBody: ResponseBody = {
			message: "New user inserted into database",
			status: ResponseStatus.GOOD,
		};

		return res.json(resBody);
	} catch (e) {
		console.log(e);
		const resBody: ResponseBody = {
			message: "Error handling request",
			status: ResponseStatus.BAD,
		};

		return res.status(500).json(resBody);
	}
});

router.post("/login", async (req: Request, res: Response) => {
	try {
		// TODO: validate body parameters
		// TODO: password hashing in database
		// TODO: make error messages less specific for security

		const username = req.body.username;
		const password = req.body.password;

		const foundUser = await UserSchema.findOne({ username: username });

		if (!foundUser) {
			return res
				.status(400)
				.json({ status: ResponseStatus.BAD, message: "User does not exist" });
		}

		if (foundUser.password !== password) {
			return res.status(402).json({ status: ResponseStatus.BAD, message: "Wrong password" });
		}

		// TODO: initialize session for the user

		const resBody: ResponseBody = {
			message: "Successful login",
			status: ResponseStatus.GOOD,
		};

		return res.json(resBody);
	} catch (e) {
		console.log(e);
		const resBody: ResponseBody = {
			message: "Error handling request",
			status: ResponseStatus.BAD,
		};

		return res.status(500).json(resBody);
	}
});

export default router;
