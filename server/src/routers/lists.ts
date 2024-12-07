import { Request, Response, Router } from "express";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import { validDateString } from "../lib.js";
import NoteSchema from "../schemas/Note.js";
import NoteItemSchema from "../schemas/NoteList.js";
import type { ListItem } from "../types/Note.js";
import { Types } from "mongoose";

const router: Router = Router();

router.post("/", async (req: Request, res: Response) => {
	try {
		// TODO: validate note input
		// TODO: validate body fields

		console.log(req.body);
		const inputNoteId = req.body.noteId as string | undefined;
		const inputText = req.body.text as string | undefined;
		const inputCompleted = req.body.completed as boolean | undefined;
		const inputEndDateStr = req.body.endDate as string | undefined;

		if (!inputNoteId || !inputText) {
			console.log("Invalid body: 'noteId' and 'text' required");

			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid body: 'noteId' and 'text' required",
			});
		}

		if (!req.user || !req.user.id) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "User not logged in",
			});
		}

		if (inputEndDateStr && !validDateString(inputEndDateStr)) {
			console.log("Invalid date format: ", inputEndDateStr);
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid date format: " + inputEndDateStr,
			});
		}

		const foundNote = await NoteSchema.findById(inputNoteId).lean();

		if (!foundNote) {
			const resBody: ResponseBody = {
				message: "Note with id " + inputNoteId + " not found!",
				status: ResponseStatus.BAD,
			};
			console.log("Note with id " + inputNoteId + " not found!");
			return res.status(400).json(resBody);
		}

		if (foundNote.owner.toString() !== req.user.id) {
			const resBody: ResponseBody = {
				message: "User not authorized to access this note item",
				status: ResponseStatus.BAD,
			};
			console.log("User not authorized to access this note item");
			return res.status(401).json(resBody);
		}

		const createdItem = await NoteItemSchema.create({
			noteId: foundNote._id,
			text: inputText,
			completed: inputCompleted,
			endDate: inputEndDateStr ? new Date(inputEndDateStr) : undefined,
		});

		console.log("Inserted item list: ", createdItem);

		const resBody: ResponseBody = {
			message: "Note inserted into database",
			status: ResponseStatus.GOOD,
			value: createdItem._id.toString(),
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
	const itemId = req.params.id as string;

	try {
		// TODO: validate param
		// TODO: validate body fields
		const inputText = req.body.text as string | undefined;
		const inputCompleted = req.body.completed as boolean | undefined;
		const inputEndDateStr = req.body.endDate as string | undefined;

		if (!inputText && !inputCompleted && !inputEndDateStr) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message:
					"Invalid body: 'text', 'completed' or 'endDate' required, nothing to update",
			});
		}

		if (inputEndDateStr && !validDateString(inputEndDateStr)) {
			console.log("Invalid date format: ", inputEndDateStr);
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid date format: " + inputEndDateStr,
			});
		}

		const foundItem = await NoteItemSchema.findById(itemId).lean();

		if (!foundItem) {
			console.log("Item with id " + itemId + " not found!");
			const resBody: ResponseBody = {
				message: "Item with id " + itemId + " not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		const foundNote = await NoteSchema.findById(foundItem.noteId).lean();

		if (!foundNote) {
			const resBody: ResponseBody = {
				message: "Note with id " + foundItem.noteId + " not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		const updatedItem: ListItem = {
			id: foundItem._id.toString(),
			text: inputText ? inputText : foundItem.text,
			completed: inputCompleted ? inputCompleted : foundItem.completed,
			endDate: inputEndDateStr
				? new Date(inputEndDateStr)
				: foundItem.endDate
				? foundItem.endDate
				: undefined,
		};

		console.log("Updating item: from ", foundItem, " to ", updatedItem);

		await NoteItemSchema.findByIdAndUpdate(foundItem._id, {
			text: updatedItem.text,
			completed: updatedItem.completed,
			endDate: updatedItem.endDate,
		});

		// TODO: filter the fields of the found note
		const resBody: ResponseBody = {
			message: "Note updated in database",
			status: ResponseStatus.GOOD,
			value: updatedItem,
		};

		return res.status(200).json(resBody);
	} catch (e) {
		console.log(e);
		const resBody: ResponseBody = {
			message: "Error handling request",
			status: ResponseStatus.BAD,
		};

		return res.status(500).json(resBody);
	}
});

router.delete("/:id", async (req: Request, res: Response) => {
	const itemId = req.params.id as string;

	try {
		// TODO: validate param
		// TODO: validate body fields

		if (!Types.ObjectId.isValid(itemId)) {
			console.log("Invalid item id: ", itemId);
			const resBody: ResponseBody = {
				message: "Invalid item id: " + itemId,
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		const deletedItem = await NoteItemSchema.findByIdAndDelete(itemId);

		if (!deletedItem) {
			console.log("Item with id " + itemId + " not found!");
			const resBody: ResponseBody = {
				message: "Item with id " + itemId + " not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		console.log("Deleted item: ", deletedItem);

		// TODO: filter the fields of the found note
		const resBody: ResponseBody = {
			message: "Note deleted from database",
			status: ResponseStatus.GOOD,
			value: deletedItem._id.toString(),
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
