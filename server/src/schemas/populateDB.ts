// import { Event } from "../types/Event.js";
// import { Event } from "../types/Event.js";
import type Activity from "../types/Activity.ts";
import { AdvancementType } from "../types/Activity.ts";
import Note from "../types/Note.js";
import Pomodoro from "../types/Pomodoro.js";
import { Privacy } from "../types/Privacy.js";
import User from "../types/User.js";
import { ActivitySchema } from "./Activity.ts";
// import EventSchema from "./Event.js";
import NoteSchema from "./Note.js";
import PomodoroSchema from "./Pomodoro.js";
import { ProjectSchema, type ProjectDBSchema } from "./Project.ts";
import UserSchema from "./User.js";
import CurrentDateSchema from "./currentDate.js";
import * as argon2 from "argon2";

// insert fake users if they do not exist

var userFV1Id: string;
var userFV2Id: string;
var userFV3Id: string;
var userFV4Id: string;
export async function createDummyUsers() {
	try {
		const dummyUsers: User[] = [
			{
				id: "",
				username: "fv1",
				password: await argon2.hash("12345678"),
				firstName: "testFName",
				lastName: "testLName",
				birthday: new Date(),
				address: "via falsa 1234",
			},
			{
				id: "",
				username: "fv2",
				password: await argon2.hash("12345678"),
				firstName: "testFName",
				lastName: "testLName",
				birthday: new Date(),
				address: "via falsa 1234",
			},
			{
				id: "",
				username: "fv3",
				password: await argon2.hash("12345678"),
				firstName: "testFName",
				lastName: "testLName",
				birthday: new Date(),
				address: "via falsa 1234",
			},
			{
				id: "",
				username: "fv4",
				password: await argon2.hash("12345678"),
				firstName: "testFName",
				lastName: "testLName",
				birthday: new Date(),
				address: "via falsa 1234",
			},
			{
				id: "",
				username: "fvPM",
				password: await argon2.hash("12345678"),
				firstName: "testFName",
				lastName: "testLName",
				birthday: new Date(),
				address: "via falsa 1234",
			},
		];

		for (const user of dummyUsers) {
			const foundUser = await UserSchema.findOne({
				username: user.username,
			});
			if (!foundUser) {
				const newUser = await UserSchema.create(user);
				console.log("User created!");
				switch (newUser.username) {
					case "fv1":
						userFV1Id = newUser._id.toString();
						break;
					case "fv2":
						userFV2Id = newUser._id.toString();
						break;
					case "fv3":
						userFV3Id = newUser._id.toString();
						break;
					case "fv4":
						userFV4Id = newUser._id.toString();
						break;
					case "fvPM":
						break;
				}
			} else {
				console.log("User already present!");
				switch (foundUser.username) {
					case "fv1":
						userFV1Id = foundUser._id.toString();
						break;
					case "fv2":
						userFV2Id = foundUser._id.toString();
						break;
					case "fv3":
						userFV3Id = foundUser._id.toString();
						break;
					case "fv4":
						userFV4Id = foundUser._id.toString();
						break;
					case "fvPM":
						break;
				}
			}
			console.log(userFV1Id, userFV2Id, userFV3Id, userFV4Id);
		}
	} catch (e) {
		console.log(e);
	}
}

// insert fake events if they do not exist
/*  //COMMENTO PERCHE' MI CAUSA UN BUG VISIVO NELLA GENERAZIOEN DEI "PALLINI SUL CALENDARIO"
export async function createDummyEvents() {
	const user = await UserSchema.findOne({ username: "fv1" });

	if (!user) {
		console.log("User not found; abort creation of events");
		return;
	}
	const dummyEvents: Event[] = [
		{
			id: "",
			owner: user._id.toString(),
			title: "Sun Donato",
			startTime: new Date("2024-01-12"),
			endTime: new Date("2025-01-13"),
			recurring: false,
			location: "Bologna",
		},
	];
	for (const event of dummyEvents) {
		const foundEvent = await EventSchema.findOne({ title: event.title });
		if (!foundEvent) {
			await EventSchema.create(event);
			console.log("Event created!");
		} else {
			console.log("Event already present!");
		}
	}
}
	*/

// insert fake notes if they do not exist
export async function createDummyNotes() {
	try {
		const user = await UserSchema.findOne({ username: "fv1" });

		if (!user) {
			console.log("User not found; abort creation of notes");
			return;
		}
		const dummyNotes: Note[] = [
			{
				owner: user._id.toString(),
				title: "Title Text",
				text: "Welcome, this is a text!",
				tags: ["test"],
				privacy: Privacy.PRIVATE,
				accessList: [],
			},
			{
				id: "",
				title: "A new note",
				owner: user._id.toString(),
				text: "Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!",
				tags: ["test"],
				privacy: Privacy.PRIVATE,
				accessList: [],
			},
		];
		for (const note of dummyNotes) {
			const foundNote = await NoteSchema.findOne({ title: note.title });
			if (!foundNote) {
				await NoteSchema.create(note);
				console.log("Note created!");
			} else {
				console.log("Note already present!");
			}
		}
	} catch (e) {
		console.log(e);
	}
}

export async function createCurrentDate() {
	try {
		const foundDate = await CurrentDateSchema.findOne(); // Trova la data corrente
		if (!foundDate) {
			// Esegui il comando di inserimento
			await CurrentDateSchema.create({ date: new Date() }); // Inserisci la data corrente
			console.log("Current date created!");
		} else {
			console.log("Current date already present!");
		}
	} catch (e) {
		console.log("Error while creating current date:", e); // Stampa l'errore
	}
}

// insert fake pomodoro sessions if they do not exist
export async function createDummyPomodoros() {
	try {
		const user = await UserSchema.findOne({ username: "fv1" });

		if (!user) {
			console.log("User not found; abort creation of pomodoros");
			return;
		}
		const dummyPomodoros: Pomodoro[] = [
			{
				id: "",
				owner: user._id.toString(),
				studyTime: 10,
				pauseTime: 5,
				cycles: 2,
			},
		];
		for (const pomodoro of dummyPomodoros) {
			const foundPomodoro = await PomodoroSchema.findOne({
				studyTime: pomodoro.studyTime,
			});
			if (!foundPomodoro) {
				await PomodoroSchema.create(pomodoro);
				console.log("Pomodoro created!");
			} else {
				console.log("Pomodoro already present!");
			}
		}
	} catch (e) {
		console.log(e);
	}
}

// insert fake users if they do not exist
export async function createDummyProject() {
	
	try {
		const progettoScritto = new ProjectSchema({
			title: "Preparazione Esame Scritto",
			description: "Preparazione Esame Scritto",
			owner: userFV1Id,
			accessList: [userFV1Id],
		});

		const idProgettoScritto = await createProject(progettoScritto);

		const progettoProgetto = new ProjectSchema({
			title: "Preparazione Progetto",
			description: "Preparazione Progetto",
			owner: userFV1Id,
			accessList: [userFV1Id, userFV2Id, userFV3Id],
		});

		const idProgettoProgetto = await createProject(progettoProgetto);

		const ripasso: Activity = {
			title: "Ripasso",
			description: "Ripasso",
			start: new Date("2024-05-29"),
			deadline: new Date("2024-06-11"),
			accessList: [userFV1Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoScritto,
			parent: null,
			next: null,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		const idRipasso = await createActivity(ripasso);

		const studioFramework: Activity = {
			title: "Studio Framework",
			description: "Studio Framework",

			start: new Date("2024-05-22"),
			deadline: new Date("2024-05-28"),
			accessList: [userFV1Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoScritto,
			parent: null,
			next: idRipasso,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		const idStudioFramework = await createActivity(studioFramework);

		const studioJS: Activity = {
			title: "Studio JS",
			description: "Studio JS",
			start: new Date("2024-05-15"),
			deadline: new Date("2024-05-21"),

			accessList: [userFV1Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoScritto,
			parent: null,
			next: idStudioFramework,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		const idStudioJS = await createActivity(studioJS);

		const studioHTML: Activity = {
			title: "Studio HTML",
			description: "Studio HTML",
			start: new Date("2024-05-08"),
			deadline: new Date("2024-05-14"),
			accessList: [userFV1Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoScritto,
			parent: null,
			next: idStudioJS,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		const idStudioHTML = await createActivity(studioHTML);

		const studioTeoria: Activity = {
			title: "Studio Teoria",
			description: "Studio Teoria",
			start: new Date("2024-05-01"),
			deadline: new Date("2024-05-07"),
			accessList: [userFV1Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoScritto,
			parent: null,
			next: idStudioHTML,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		await createActivity(studioTeoria);

		// progetto Progetto
		const modulo3Test: Activity = {
			title: "Test Modulo 3",
			description: "Test Modulo 3",
			start: new Date("2024-05-26"),
			deadline: new Date("2024-05-31"),
			accessList: [userFV3Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoProgetto,
			parent: null,
			next: null,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		const idModulo3Test = await createActivity(modulo3Test);

		const modulo3: Activity = {
			title: "Modulo 3",
			description: "Modulo 3",
			start: new Date("2024-05-22"),
			deadline: new Date("2024-05-28"),
			accessList: [userFV3Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoProgetto,
			parent: null,
			next: idModulo3Test,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		const idModulo3 = await createActivity(modulo3);

		const modulo2Test: Activity = {
			title: "Test Modulo 2",
			description: "Test Modulo 2",
			start: new Date("2024-06-04"),
			deadline: new Date("2024-06-28"),
			accessList: [userFV2Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoProgetto,
			parent: null,
			next: idModulo3,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		const idModulo2Test = await createActivity(modulo2Test);

		const modulo2: Activity = {
			title: "Modulo 2",
			description: "Modulo 2",
			start: new Date("2024-05-29"),
			deadline: new Date("2024-06-04"),
			accessList: [userFV2Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoProgetto,
			parent: null,
			next: idModulo2Test,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		const idModulo2 = await createActivity(modulo2);

		const modulo1Test: Activity = {
			title: "Test Modulo 1",
			description: "modulo 1",
			start: new Date("2024-05-22"),
			deadline: new Date("2024-05-28"),
			accessList: [userFV1Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoProgetto,
			parent: null,
			next: idModulo2,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		const idModulo1Test = await createActivity(modulo1Test);

		const modulo1: Activity = {
			title: "Modulo 1",
			description: "modulo 1",
			start: new Date("2024-05-02"),
			deadline: new Date("2024-05-21"),
			accessList: [userFV1Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoProgetto,
			parent: null,
			next: idModulo1Test,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		const idModulo1 = await createActivity(modulo1);

		const testProgettoBase: Activity = {
			title: "Test Progetto Base",
			description: "Studio HTML",
			start: new Date("2024-04-30"),
			deadline: new Date("2024-04-31"),
			accessList: [userFV1Id, userFV2Id, userFV3Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoProgetto,
			parent: null,
			next: idModulo1,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		const idTestProgettoBase = await createActivity(testProgettoBase);

		const progettoBase: Activity = {
			title: "Progetto Base",
			description: "Studio Teoria",

			start: new Date("2024-04-10"),
			deadline: new Date("2024-04-30"),
			accessList: [userFV1Id, userFV2Id, userFV3Id],
			owner: userFV1Id,
			completed: false,
			advancementType: AdvancementType.TRANSLATION,
			milestone: false,
			projectId: idProgettoProgetto,
			parent: null,
			next: idTestProgettoBase,
			abandoned: false,
			reactivated: false,
			children: [],
			active: false,
		};

		await createActivity(progettoBase);
	} catch (e) {
		console.log(e);
	}
}

async function createProject(schema: ProjectDBSchema): Promise<string> {
	try {
		const foundProject = await ProjectSchema.findOne({ title: schema.title });
		if (foundProject) {
			console.log("Project already present!");
			return foundProject._id.toString();
		}
		const newProject = new ProjectSchema(schema);
		const savedProject = await newProject.save();
		console.log("Project created!");

		return savedProject._id.toString();
	} catch (e) {
		console.log(e);
		return "";
	}
}

async function createActivity(schema: Activity): Promise<string> {
	try {
		const foundActivity = await ActivitySchema.findOne({ title: schema.title });
		if (foundActivity) {
			console.log("Activity already present!");
			return foundActivity._id.toString();
		}
		const newActivity = new ActivitySchema(schema);
		const savedActivity = await newActivity.save();
		console.log("Activity created!");

		return savedActivity._id.toString();
	} catch (e) {
		console.log(e);
		return "";
	}
}
