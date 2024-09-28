// import { Event } from "../types/Event.js";
import { Event } from "../types/Event.js";
import Note from "../types/Note.js";
import Pomodoro from "../types/Pomodoro.js";
import User from "../types/User.js";
import EventSchema from "./Event.js";
import NoteSchema from "./Note.js";
import PomodoroSchema from "./Pomodoro.js";
import UserSchema from "./User.js";

// insert fake users if they do not exist
export async function createDummyUsers() {
	const dummyUsers: User[] = [
		{
			id: "",
			username: "fv1",
			password: "12345678",
			firstName: "testFName",
			lastName: "testLName",
			birthday: new Date(),
			address: "via falsa 1234",
		},
		{
			id: "",
			username: "fv2",
			password: "12345678",
			firstName: "testFName",
			lastName: "testLName",
			birthday: new Date(),
			address: "via falsa 1234",
		},
		{
			id: "",
			username: "fv3",
			password: "12345678",
			firstName: "testFName",
			lastName: "testLName",
			birthday: new Date(),
			address: "via falsa 1234",
		},
		{
			id: "",
			username: "fv4",
			password: "12345678",
			firstName: "testFName",
			lastName: "testLName",
			birthday: new Date(),
			address: "via falsa 1234",
		},
		{
			id: "",
			username: "fvPM",
			password: "12345678",
			firstName: "testFName",
			lastName: "testLName",
			birthday: new Date(),
			address: "via falsa 1234",
		},
	];
	for (const user of dummyUsers) {
		const foundUser = await UserSchema.findOne({ username: user.username });
		if (!foundUser) {
			await UserSchema.create(user);
			console.log("User created!");
		} else {
			console.log("User already present!");
		}
	}
}

// insert fake events if they do not exist
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

// insert fake notes if they do not exist
export async function createDummyNotes() {
	const user = await UserSchema.findOne({ username: "fv1" });

	if (!user) {
		console.log("User not found; abort creation of notes");
		return;
	}
	const dummyNotes: Note[] = [
		{
			id: "",
			owner: user._id.toString(),
			title: "Title Text",
			text: "Welcome, this is a text!",
			tags: ["test"],
		},
		{
			id: "",
			title: "A new note",
			owner: user._id.toString(),
			text: "Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!Welcome, this is a text!",
			tags: ["test"],
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
}

// insert fake pomodoro sessions if they do not exist
export async function createDummyPomodoros() {
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
		const foundPomodoro = await PomodoroSchema.findOne({ studyTime: pomodoro.studyTime });
		if (!foundPomodoro) {
			await PomodoroSchema.create(pomodoro);
			console.log("Pomodoro created!");
		} else {
			console.log("Pomodoro already present!");
		}
	}
}
