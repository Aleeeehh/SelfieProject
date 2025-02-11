import express, { Application, ErrorRequestHandler, Request, Response } from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import { default as apiRouter } from "./routers/api.js";
import mongoose from "mongoose";
import {
	//createDummyEvents,
	createDummyNotes,
	createDummyPomodoros,
	createDummyUsers,
	createCurrentDate,
	createDummyProject,
} from "./schemas/populateDB.js";
import passport from "passport";
import * as passportStrategy from "passport-local";
import MongoStore from "connect-mongo";
import UserSchema from "./schemas/User.js";
import * as argon2 from "argon2";

// Connect to database
// const DB_USER = "";
//const DB_PSWD = "";

//////////////////////////////////////
//// PRODUCTION
/*
const DB_HOST = "mongo_site232402";
const DB_PORT = "27017";
const DB_APP_NAME = "selfie_db";
const DB_SESSION = "session_db";
const SESSION_SECRET = "gdsjkhgsdjkhsdgkjsdhgsahfiaofhioh";
const DB_USER = "site232402";
const DB_PSWD = "oot3epuM";
const dbConnectionString = `mongodb://${DB_USER}:${DB_PSWD}@${DB_HOST}:${DB_PORT}`;
const connectionOptions = `?authSource=admin&writeConcern=majority`;
*/
//////////////////////////////////////

//////////////////////////////////////
//// DEVELOPMENT

const DB_HOST = "localhost";
const DB_PORT = "27017";
const DB_APP_NAME = "selfie_db";
const DB_SESSION = "session_db";
const SESSION_SECRET = "secret";
const dbConnectionString = `mongodb://${DB_HOST}:${DB_PORT}`;
const connectionOptions = ``;

//////////////////////////////////////

// store of sessions
const store = MongoStore.create({
	mongoUrl: dbConnectionString + `/${DB_SESSION}` + connectionOptions, // MongoDB connection URI
	dbName: DB_SESSION, // Collection name for storing sessions
});

store.on("error", function (error: ErrorRequestHandler) {
	console.log({ type: "Database", error: error });
});

const server: Application = express();
const PORT = 8000;

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors());
server.enable("trust proxy");

server.use(
	session({
		name: "SELFIE",
		secret: SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		store: store,
		rolling: true,
		cookie: {
			secure: false, // Set to true if using HTTPS
			httpOnly: true,
			maxAge: 60 * 1000 * 60, // L'ultimo numero rappresenta il numero di minuti di durata di una sessione di login
		},
	})
);

// Passport
server.use(passport.initialize());
server.use(passport.session());

passport.use(
	new passportStrategy.Strategy(
		{
			usernameField: "username",
			passwordField: "password",
		},
		async (username, password, done) => {
			try {
				const user = await UserSchema.findOne({ username: username });
				if (!user) {
					console.log("Email not correct", username);
					return done(null, false, {
						message: "Email or password not correct",
					}); // Indicate that no user was found with the provided username
				}

				// const validPassword = await argon2.verify(user.password, password);
				const validPassword = await argon2.verify(user.password, password);

				if (!validPassword) {
					console.log("Password not correct", password);
					return done(null, false, {
						message: "Email or password not correct",
					}); // Indicate that the password is incorrect
				}

				// If authentication is successful, pass the user object to indicate success
				return done(null, user);
			} catch (error) {
				console.log(error);
				return done(error); // Pass the error to indicate an error occurred
			}
		}
	)
);

// Serialization: Save user ID to session
passport.serializeUser(function (user: any, done) {
	done(null, user._id.toString());
});

// Deserialization: Retrieve user object from session using user ID
passport.deserializeUser(async function (id, done) {
	const user = await UserSchema.findById(id);
	done(null, user);
});

// Api routes definition
server.use("/api", apiRouter);

// Serve the static React files
const dirname = path.resolve();

server.use("/js", express.static(path.join(dirname, "build", "js")));
server.use("/css", express.static(path.join(dirname, "build", "css")));
server.use("/img", express.static(path.join(dirname, "build", "media")));

server.use(express.static(path.join(dirname, "webapp", "build")));

server.get("*", (_: Request, res: Response) => {
	res.sendFile(path.join(dirname, "webapp", "build", "index.html"));
});

// TODO: Use authentication for DB
// mongoose.connect(`mongodb://${DB_USER}:${DB_PSWD}@${DB_HOST}:${DB_PORT}/${DB_APP_NAME}`);
mongoose
	.connect(dbConnectionString + `/${DB_APP_NAME}` + connectionOptions)
	.then(() => createDummyUsers())
	//.then(() => createDummyEvents())
	.then(() => createDummyNotes())
	.then(() => createDummyPomodoros())
	.then(() => createCurrentDate())
	.then(() => createDummyProject());

mongoose.set("sanitizeFilter", true); // sanitize from NoSQLite
mongoose.set("strictQuery", true); // only schema fields are saved in database!!!

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

// Start the server
server.listen(PORT, () => {
	console.log("Server listening on port", PORT);
});

export default server;
