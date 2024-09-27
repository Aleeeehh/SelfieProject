import { Request, Response, Router } from "express";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import { validDateString } from "../lib.js";
import { Order } from "../enums.js";
import NoteSchema from "../schemas/Note.js";
import type Note from "../types/Note.js";
import UserSchema from "../schemas/User.js";
import { ObjectId } from "mongodb";

const router: Router = Router();

router.get("/", async (req: Request, res: Response) => {
	try {
		const dateFromStr = req.query.from as string | undefined;
		const dateToStr = req.query.to as string | undefined;
		const order = req.query.order as Order | undefined;
		if (order && !Object.values(Order).includes(order)) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid order: should be 'date', 'length' or 'name",
			});
		}

		var dateFrom = null;
		if (dateFromStr && !validDateString(dateFromStr))
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Dates must be in the format: YYYY-MM-DD",
			});
		else if (dateFromStr) dateFrom = new Date(dateFromStr);

		var dateTo = null;
		if (dateToStr && !validDateString(dateToStr))
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Dates must be in the format: YYYY-MM-DD",
			});
		else if (dateToStr) dateTo = new Date(dateToStr);

		const filter: any = {}; //TODO: add userId for current user

		if (dateFrom) filter.startTime = { $gte: dateFrom };
		if (dateTo) filter.endTime = { $lte: dateTo };

		// TODO: filter per logged user
		const foundNotes = await NoteSchema.find(filter).lean();
		const notes = [];

		for (const note of foundNotes) {
			const newNote: Note = {
				id: note._id.toString(),
				owner: note.owner.toString(),
				title: note.title,
				text: note.text || "",
				tags: note.tags || [],
				createdAt: note.createdAt,
				updatedAt: note.updatedAt,
			};

			notes.push(newNote);
		}

		let sortedNotes: Note[] = [];
		switch (order) {
			case Order.NAME:
				sortedNotes = notes.sort((note1, note2) =>
					note1.title.toLowerCase().localeCompare(note2.title.toLowerCase())
				);
				break;
			case Order.LENGTH:
				sortedNotes = notes.sort((note1, note2) => note2.text.length - note1.text.length);
				break;
			default:
				// default case: order == date
				sortedNotes = notes.sort((note1, note2) => {
					if (!note2.createdAt) return -1;
					if (!note1.createdAt) return 1;
					return note2.createdAt.getTime() - note1.createdAt.getTime();
				});
				break;
		}

		return res.json({ status: ResponseStatus.GOOD, value: sortedNotes });
	} catch (e) {
		console.log(e);
		const resBody: ResponseBody = {
			message: "Error handling request",
			status: ResponseStatus.BAD,
		};

		return res.status(500).json(resBody);
	}
});

router.get("/:id", async (req: Request, res: Response) => {
	const noteId = req.params.id as string;

	try {
		// TODO: validate param
		// TODO: validate body fields

		try {
			new ObjectId(noteId);
		} catch (e) {
			const resBody: ResponseBody = {
				message: "Note with id " + noteId + " not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}
		const foundNote = await NoteSchema.findById(noteId).lean();

		if (!foundNote) {
			const resBody: ResponseBody = {
				message: "Note with id " + noteId + " not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		const note: Note = {
			id: foundNote._id.toString(),
			owner: foundNote.owner.toString(),
			title: foundNote.title,
			text: foundNote.text,
			tags: foundNote.tags,
			createdAt: foundNote.createdAt,
			updatedAt: foundNote.updatedAt,
		};

		// TODO: filter the fields of the found note
		const resBody: ResponseBody = {
			status: ResponseStatus.GOOD,
			value: note,
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

router.post("/", async (req: Request, res: Response) => {
	try {
		// TODO: validate note input
		// TODO: validate body fields

		const newNote: Note = req.body as Note;

		if (!newNote.owner) {
			const user = await UserSchema.findOne().lean();
			if (!user) {
				console.log("Error finding user");
				return res
					.status(400)
					.json({ status: ResponseStatus.BAD, message: "Error finding user" });
			}
			newNote.owner = user._id.toString();
		}

		const createdNote = await NoteSchema.create(newNote);
		console.log("Inserted note: ", newNote);

		const resBody: ResponseBody = {
			message: "Note inserted into database",
			status: ResponseStatus.GOOD,
			value: createdNote._id.toString(),
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

router.put("/:id", async (req: Request, res: Response) => {
	const noteId = req.params.id as string;
	const updatedNote = req.body as Note;

	try {
		// TODO: validate param
		// TODO: validate body fields

		const foundNote = await NoteSchema.findById(noteId);

		if (!foundNote) {
			const resBody: ResponseBody = {
				message: "Note with id " + noteId + " not found!",
				status: ResponseStatus.BAD,
			};

			res.status(400).json(resBody);
		}

		console.log("Updating note: ", foundNote, " to ", updatedNote);

		await NoteSchema.findByIdAndUpdate(noteId, updatedNote);

		// TODO: filter the fields of the found note
		const resBody: ResponseBody = {
			message: "Note updated in database",
			status: ResponseStatus.GOOD,
			value: updatedNote,
		};

		res.json(resBody);
	} catch (e) {
		console.log(e);
		const resBody: ResponseBody = {
			message: "Error handling request",
			status: ResponseStatus.BAD,
		};

		res.status(500).json(resBody);
	}
});

router.delete("/:id", async (req: Request, res: Response) => {
	const noteId = req.params.id as string;

	try {
		// TODO: validate param
		// TODO: validate body fields

		const foundNote = await NoteSchema.findByIdAndDelete(noteId);

		if (!foundNote) {
			const resBody: ResponseBody = {
				message: "Note with id " + noteId + " not found!",
				status: ResponseStatus.BAD,
			};

			res.status(400).json(resBody);
		}

		console.log("Deleted note: ", foundNote);

		// TODO: filter the fields of the found note
		const resBody: ResponseBody = {
			message: "Note deleted from database",
			status: ResponseStatus.GOOD,
			value: foundNote,
		};

		res.json(resBody);
	} catch (e) {
		console.log(e);
		const resBody: ResponseBody = {
			message: "Error handling request",
			status: ResponseStatus.BAD,
		};

		res.status(500).json(resBody);
	}
});

export default router;
