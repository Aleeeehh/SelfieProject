import { Request, Response, Router } from "express";

import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import UserSchema from "../schemas/User.js";
import { validDateString } from "../lib.js";
import User from "../types/User.js";
import passport from "passport";
import { checkAuthentication } from "./api.js";
const router: Router = Router();


// get if the current user
router.get("/", async (req: Request, res: Response) => {
	if (req.user) {
		const foundUser = await UserSchema.findById(req.user.id).lean();
		return res.status(200).json({ status: ResponseStatus.GOOD, value: foundUser });
	}
	else return res.status(402).json({ status: ResponseStatus.BAD, value: false });
});

//get current user informations

/*
router.get("/current", checkAuthentication, (req: Request, res: Response) => {
	console.log(req.user);
	if (req.user) {
		// Se l'utente è autenticato, restituisci i dati dell'utente
		return res.status(200).json({
			status: ResponseStatus.GOOD,
			value: {
				id: req.user.id,
				username: req.body.username, //?????
				firstName: req.body.firstName, //?????
				lastName: req.body.lastName, //?????
				birthday: req.body.birthday, //?????
			},
		});
	} else {
		// Se l'utente non è autenticato, restituisci un errore
		return res.status(401).json({
			status: ResponseStatus.BAD,
			message: "Utente non autenticato",
		});
	}
});
*/

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

router.post("/login", passport.authenticate("local"), async (req: Request, res: Response) => {
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

router.post("/logout", checkAuthentication, async (req, res) => {
	try {
		// delete session cookie
		res.clearCookie("connect.sid");

		return req.logout(function (err) {
			if (err) {
				return res
					.status(400)
					.json({ status: ResponseStatus.BAD, message: "Error logging out" });
			}
			// logout of passport
			return req.session.destroy(function (err) {
				if (err) {
					return res
						.status(400)
						.json({ status: ResponseStatus.BAD, message: "Error logging out" });
				}
				// destroy the session
				return res
					.status(200)
					.json({ status: ResponseStatus.GOOD, message: "Successfully logged out" }); // send to the client
			});
		});
	} catch (err) {
		console.error("Error logging out:", err);
		return res.status(500).json({ status: ResponseStatus.BAD, message: "Error logging out" });
	}
});

// Delete a user by ID
router.delete("/", checkAuthentication, async (req, res) => {
	try {
		// get the requesting user
		const user = await UserSchema.findByIdAndDelete(req.user?.id);

		if (!user) {
			return res.status(404).json({ status: ResponseStatus.BAD, message: "User not found" });
		}

		// send email token to confirm account deletion
		console.log("Requested account deletion for user: ", user.username);

		return res.status(200).json({
			status: ResponseStatus.GOOD,
			message:
				"Request completed: we sent an email to confirm that you want to delete the account.",
		});
	} catch (error) {
		console.log(error);

		return res.status(500).json({ status: ResponseStatus.BAD, message: "Error" });
	}
});

export default router;
