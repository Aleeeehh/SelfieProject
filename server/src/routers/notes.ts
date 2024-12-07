import { Request, Response, Router } from "express";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import { validDateString } from "../lib.js";
import { Order } from "../enums.js";
import NoteSchema from "../schemas/Note.js";
import type Note from "../types/Note.js";
import UserSchema from "../schemas/User.js";
import { Types } from "mongoose";
import { ObjectId } from "mongodb";
// import NoteAccessSchema from "../schemas/NoteAccess.js";
// import UserResult from "../types/UserResult.js";
import { Privacy } from "../types/Privacy.js";
import NoteItemSchema from "../schemas/NoteList.js";
import type { ListItem } from "../types/Note.js";
import { getIdListFromUsernameList, getUsernameListFromIdList } from "./lib.js";

const router: Router = Router();

// Returns only the notes for which the current user is the owner (not the notes to which the user has access)
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

		// TODO: validate param

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

		if (!req.user || !req.user.id)
			return res.status(401).json({
				status: ResponseStatus.BAD,
				message: "You need to be logged in to access this resource",
			});

		const userId = req.user.id;

		const filter: any = { $or: [{ owner: userId }, { accessList: userId }] };

		if (dateFrom) filter.startTime = { $gte: dateFrom };
		if (dateTo) filter.endTime = { $lte: dateTo };

		// TODO: filter per logged user
		const foundNotes = await NoteSchema.find(filter).lean();
		const notes = [];

		for (const note of foundNotes) {
			// retrieve todo list from db
			const toDoList: ListItem[] = [];
			const foundTodoList = await NoteItemSchema.find({
				noteId: note._id,
			}).lean();

			for (const foundItem of foundTodoList) {
				const item: ListItem = {
					id: foundItem._id.toString(),
					text: foundItem.text,
					completed: foundItem.completed,
				};

				toDoList.push(item);
			}

			const newNote: Note = {
				id: note._id.toString(),
				owner: note.owner.toString(),
				title: note.title,
				text: note.text || "",
				tags: note.tags || [],
				createdAt: note.createdAt,
				updatedAt: note.updatedAt,
				privacy: note.privacy.toString() as Privacy,
				accessList: [],
				toDoList,
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

		// database collection note_access [user_id, note_id]
		// const foundaccessList = await NoteAccessSchema.find({
		// 	note: noteId,
		// }).lean();

		// manage access to note based on privacy value
		// if public, can access
		if (foundNote.privacy !== Privacy.PUBLIC) {
			// check if the user is can access the note
			if (!req.user || !req.user.id)
				return res.status(401).json({
					status: ResponseStatus.BAD,
					message: "User not logged in",
				});

			if (foundNote.owner.toString() !== req.user.id) {
				// if user is not owner, check if the user can access the note
				const foundAccess = foundNote.accessList.some((x) => x.toString() === req.user!.id);

				if (foundNote.privacy === Privacy.PRIVATE || !foundAccess) {
					const resBody: ResponseBody = {
						status: ResponseStatus.BAD,
						message: "User not authorized to access this note",
					};

					return res.status(401).json(resBody);
				}
			}
		}

		const foundItemList = await NoteItemSchema.find({
			noteId: noteId,
		}).lean();

		const note: Note = {
			id: foundNote._id.toString(),
			owner: foundNote.owner.toString(),
			title: foundNote.title,
			text: foundNote.text,
			tags: foundNote.tags,
			createdAt: foundNote.createdAt,
			updatedAt: foundNote.updatedAt,
			privacy: foundNote.privacy.toString() as Privacy,
			accessList: await getUsernameListFromIdList(foundNote.accessList),
			toDoList: foundItemList.map((x) => {
				return {
					id: x._id.toString(),
					text: x.text,
					completed: x.completed,
					endDate: x.endDate || undefined,
				};
			}),
		};

		console.log("Returning note: ", note);
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

		const inputTitle = req.body.title as string | undefined;
		const inputText = req.body.text as string | undefined;
		const inputTags = req.body.tags as string[] | [];
		const privacyStr = req.body.privacy as string | undefined;
		const accessListStr = req.body.accessList as string[] | undefined; // list of usernames
		// Leo - Note 18-33 - BEGIN
		const inputItemList = req.body.toDoList as ListItem[] | undefined;
		console.log("Questo è l'itemList:", inputItemList);
		console.log("Questo è l'itemList:", inputItemList);

		console.log("Questo è l'itemList:", inputItemList);

		// Leo - Note 18-33 - END

		if (!inputTitle || !inputText) {
			console.log("Invalid body: 'title' and 'text' required");

			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid body: 'title' and 'text' required",
			});
		}

		if (!privacyStr || !["public", "protected", "private"].includes(privacyStr))
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid privacy: should be 'public', 'protected' or 'private'",
			});

		const newAccessList: Types.ObjectId[] = accessListStr
			? await getIdListFromUsernameList(accessListStr)
			: [];

		if (!req.user || !req.user.id) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "User not logged in",
			});
		}

		const privacy: Privacy = privacyStr as Privacy;

		if (privacy === Privacy.PRIVATE && newAccessList.length > 0)
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Access list is private, but access list is not empty",
			});

		const newNote: Note = {
			owner: new ObjectId(req.user.id),
			title: inputTitle,
			text: inputText,
			tags: inputTags,
			toDoList: inputItemList,
			privacy,
			accessList: newAccessList.map((x) => x.toString()),
		};

		const createdNote = await NoteSchema.create(newNote);

		const itemList: ListItem[] = [];

		if (inputItemList) {
			for (const item of inputItemList) {
				itemList.push({
					text: item.text,
					completed: item.completed,
					endDate: item.endDate,
				});
			}
		}

		const createdItemList = await NoteItemSchema.insertMany(
			itemList.map((x) => ({
				text: x.text,
				completed: x.completed,
				noteId: createdNote._id,
				endDate: x.endDate,
			}))
		);

		console.log("Inserted note: ", createdNote._id.toString());
		console.log("Inserted access list: ", newAccessList);
		console.log("Inserted item list: ", createdItemList);

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

	console.log("PUT note: ", req.body);
	try {
		// TODO: validate param
		// TODO: validate body fields
		const inputTitle = req.body.title as string | undefined;
		const inputText = req.body.text as string | undefined;
		const inputTags = req.body.tags as string[] | undefined;
		const inputAccessList = req.body.accessList as string[] | undefined; // list of usernames
		const inputPrivacyStr = req.body.privacy as string | undefined;
		const inputItemList = req.body.toDoList as ListItem[] | undefined;
		const inputDeletedItems = req.body.deletedItems as string[] | undefined; // id list

		if (
			!inputTitle &&
			!inputText &&
			!inputTags &&
			!inputAccessList &&
			!inputPrivacyStr &&
			!inputItemList &&
			!inputDeletedItems
		) {
			console.log(
				"Invalid body: 'title', 'text', 'tags', 'accessList', 'toDoList', 'deletedItems' or 'privacy' required, nothing to update"
			);

			return res.status(400).json({
				status: ResponseStatus.BAD,
				message:
					"Invalid body: 'title', 'text', 'tags', 'accessList', 'toDoList', 'deletedItems' or 'privacy' required, nothing to update",
			});
		}

		if (inputPrivacyStr && !Object.values(Privacy).includes(inputPrivacyStr as Privacy)) {
			console.log("Invalid privacy: should be 'public', 'protected' or 'private'");
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid privacy: should be 'public', 'protected' or 'private'",
			});
		}

		const foundNote = await NoteSchema.findById(noteId).lean();

		if (!foundNote) {
			console.log("Note with id " + noteId + " not found!");
			const resBody: ResponseBody = {
				message: "Note with id " + noteId + " not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		// if input privacy is not defined, use the found note privacy
		const inputPrivacy: Privacy = inputPrivacyStr
			? (inputPrivacyStr as Privacy)
			: (foundNote.privacy as Privacy);

		const updatedAccessList: Types.ObjectId[] = [];

		// was public, remains public: validate that no input access list is defined
		if (inputPrivacy === Privacy.PUBLIC && foundNote.privacy === Privacy.PUBLIC) {
			if (inputAccessList && inputAccessList.length > 0) {
				console.log("Access list is public, but access list is not empty");
				return res.status(400).json({
					status: ResponseStatus.BAD,
					message: "Access list is public, but access list is not empty",
				});
			}
		}
		// was private, remains private: validate that no input access list is defined
		if (inputPrivacy === Privacy.PRIVATE && foundNote.privacy === Privacy.PRIVATE) {
			if (inputAccessList && inputAccessList.length > 0) {
				console.log("Access list is private, but access list is not empty");
				return res.status(400).json({
					status: ResponseStatus.BAD,
					message: "Access list is private, but access list is not empty",
				});
			}
		}

		// was protected, remains protected: use new access list, if defined
		if (inputPrivacy === Privacy.PROTECTED && inputPrivacy === foundNote.privacy) {
			if (inputAccessList && inputAccessList.length > 0) {
				for (const username of inputAccessList) {
					const user = await UserSchema.findOne({ username }).lean();
					if (!user) {
						console.log("Invalid user: " + username);
						return res.status(400).json({
							status: ResponseStatus.BAD,
							message: "Invalid user: " + username,
						});
					}
					updatedAccessList.push(user._id);
				}
			}
		}

		// Was private; becomes protected (create access list)
		if (
			inputPrivacy === Privacy.PROTECTED &&
			(foundNote.privacy as Privacy) === Privacy.PRIVATE
		) {
			if (inputAccessList && inputAccessList.length > 0)
				for (const username of inputAccessList) {
					const user = await UserSchema.findOne({ username }).lean();
					if (!user) {
						console.log("Invalid user id: " + username);
						return res.status(400).json({
							status: ResponseStatus.BAD,
							message: "Invalid user id: " + username,
						});
					}
					updatedAccessList.push(user._id);
				}
		}

		// Was private, becomes public (do nothing)
		if (inputPrivacy === Privacy.PUBLIC && foundNote.privacy === Privacy.PRIVATE) {
		}

		// Was protected, becomes private (empty access list)
		if (inputPrivacy === Privacy.PRIVATE && foundNote.privacy === Privacy.PROTECTED) {
		}

		// Was protected, becomes public (empty access list)
		if (inputPrivacy === Privacy.PUBLIC && foundNote.privacy === Privacy.PROTECTED) {
		}

		// Was public, becomes protected (create access list)
		if (inputPrivacy === Privacy.PROTECTED && foundNote.privacy === Privacy.PUBLIC) {
			if (inputAccessList && inputAccessList.length > 0)
				for (const username of inputAccessList) {
					const user = await UserSchema.findOne({ username }).lean();
					if (!user) {
						console.log("Invalid user id: " + username);
						return res.status(400).json({
							status: ResponseStatus.BAD,
							message: "Invalid user id: " + username,
						});
					}
					updatedAccessList.push(user._id);
				}
		}

		// Was public, becomes private (do nothing, empty access list)
		if (inputPrivacy === Privacy.PRIVATE && foundNote.privacy === Privacy.PUBLIC) {
		}

		if (inputItemList) {
			for (const inputItem of inputItemList) {
				if (!inputItem.id || !Types.ObjectId.isValid(inputItem.id)) {
					// Item was created, not updated; add new
					const newItem = await NoteItemSchema.create({
						noteId: noteId,
						text: inputItem.text,
						endDate: inputItem.endDate,
						completed: inputItem.completed,
					});
					console.log("Created note Item: ", newItem);
				} else {
					const updatedItem = await NoteItemSchema.findByIdAndUpdate(inputItem.id, {
						text: inputItem.text,
						endDate: inputItem.endDate,
						completed: inputItem.completed,
					});

					console.log("Updated note Item: ", updatedItem);
				}
			}
		}

		// validate deletedList
		const itemsToDelete: Types.ObjectId[] = [];
		if (inputDeletedItems)
			for (const item of inputDeletedItems) {
				if (!Types.ObjectId.isValid(item)) {
					console.log("Invalid item id: " + item);
					continue;
				}

				const foundItem = await NoteItemSchema.findById(item).lean();
				if (!foundItem) {
					console.log("Item with id " + item + " not found!");
					continue;
				}

				if (foundItem.noteId.toString() !== noteId) {
					console.log(
						"Item with id " + item + " does not belong to note with id " + noteId
					);
					continue;
				}

				itemsToDelete.push(new Types.ObjectId(item));
			}

		const updatedNote: Note = {
			owner: foundNote.owner,
			title: inputTitle || foundNote.title,
			text: inputText || foundNote.text,
			tags: inputTags || foundNote.tags,
			privacy: inputPrivacy || (foundNote.privacy as Privacy),
			accessList: updatedAccessList.map((x) => x.toString()),
		};

		console.log("Updating note: ", foundNote, " to ", updatedNote);

		await NoteSchema.findByIdAndUpdate(noteId, updatedNote);

		const list = updatedAccessList.map((id) => ({
			noteId: noteId,
			userId: id,
		}));

		console.log("Updated access list: ", list);

		// remove items from list
		const result = await NoteItemSchema.deleteMany({
			noteId: noteId,
			_id: itemsToDelete,
		});

		console.log("Deleted items from todo: ", result.deletedCount);

		// to return usernames and not ids
		updatedNote.accessList = await getUsernameListFromIdList(updatedAccessList);

		// TODO: filter the fields of the found note
		const resBody: ResponseBody = {
			message: "Note updated in database",
			status: ResponseStatus.GOOD,
			value: updatedNote,
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

// Completa un item specifico di una nota
// Completa un item specifico di una nota
router.put("/:noteId/complete-item/:itemId", async (req: Request, res: Response) => {
	try {
		const { noteId, itemId } = req.params;

		// Verifica che la nota esista
		const foundNote = await NoteSchema.findById(noteId).lean();
		if (!foundNote) {
			return res.status(404).json({
				status: ResponseStatus.BAD,
				message: `Nota con id ${noteId} non trovata`,
			});
		}

		// Trova e aggiorna l'item nel NoteItemSchema
		const updatedItem = await NoteItemSchema.findOneAndUpdate(
			{
				_id: itemId,
				noteId: noteId,
			},
			{
				completed: true,
			},
			{
				new: true,
			}
		);

		if (!updatedItem) {
			return res.status(404).json({
				status: ResponseStatus.BAD,
				message: `Item con id ${itemId} non trovato nella nota ${noteId}`,
			});
		}

		// Aggiorna anche l'item nella toDoList della nota
		await NoteSchema.updateOne(
			{
				_id: noteId,
				"toDoList.id": itemId,
			},
			{
				$set: { "toDoList.$.completed": true },
			}
		);

		console.log("Item completato:", updatedItem);

		return res.status(200).json({
			status: ResponseStatus.GOOD,
			message: "Item completato con successo",
			value: updatedItem,
		});
	} catch (e) {
		console.error("Errore durante il completamento dell'item:", e);
		return res.status(500).json({
			status: ResponseStatus.BAD,
			message: "Errore durante il completamento dell'item",
		});
	}
});

router.delete("/:id", async (req: Request, res: Response) => {
	const noteId = req.params.id as string;

	try {
		// TODO: validate param
		// TODO: validate body fields

		if (!ObjectId.isValid(noteId)) {
			const resBody: ResponseBody = {
				message: "Invalid note id: " + noteId,
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		const foundNote = await NoteSchema.findByIdAndDelete(noteId);

		if (!foundNote) {
			const resBody: ResponseBody = {
				message: "Note with id " + noteId + " not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		const deletedItems = await NoteItemSchema.deleteMany({
			note: noteId,
		});

		console.log("Deleted note: ", foundNote);
		console.log("Deleted items: ", deletedItems);

		// TODO: filter the fields of the found note
		const resBody: ResponseBody = {
			message: "Note deleted from database",
			status: ResponseStatus.GOOD,
			value: foundNote,
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
