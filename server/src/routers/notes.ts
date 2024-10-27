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
import NoteAccessSchema from "../schemas/NoteAccess.js";
import UserResult from "../types/UserResult.js";
import { Privacy } from "../types/Privacy.js";

const router: Router = Router();

/**
 * Check if the user with the given userId can access the note with the given noteId.
 *
 * This function checks if the user is the owner of the note or if the user is in the access list of the note.
 *
 * @param userId the id of the user to check
 * @param noteId the id of the note to check
 * @returns true if the user can access the note, false otherwise
 */
async function canAccess(userId: string, noteId: string): Promise<boolean> {
    // check if the user in the owner of the note
    const foundNote = await NoteSchema.findOne({
        owner: userId,
        _id: noteId,
    }).lean();
    if (foundNote) return true;

    // check if the user is in the access list
    const foundAccess = await NoteAccessSchema.findOne({
        user: userId,
        note: noteId,
    }).lean();
    if (foundAccess) return true;

    return false;
}

async function getAccessList(list: ObjectId[]): Promise<UserResult[]> {
    const accessList = [];
    for (const access of list) {
        const foundUser = await UserSchema.findById(access.toString()).lean();
        if (foundUser) {
            accessList.push({
                id: foundUser._id.toString(),
                username: foundUser.username,
            });
        }
    }

    return accessList;
}

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

        const filter: any = {};
        //TODO: add userId for current user, get the notes seeable for the user (but not modifiable)

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
                privacy: note.privacy.toString() as Privacy,
                accessList: [],
            };

            notes.push(newNote);
        }

        let sortedNotes: Note[] = [];
        switch (order) {
            case Order.NAME:
                sortedNotes = notes.sort((note1, note2) =>
                    note1.title
                        .toLowerCase()
                        .localeCompare(note2.title.toLowerCase())
                );
                break;
            case Order.LENGTH:
                sortedNotes = notes.sort(
                    (note1, note2) => note2.text.length - note1.text.length
                );
                break;
            default:
                // default case: order == date
                sortedNotes = notes.sort((note1, note2) => {
                    if (!note2.createdAt) return -1;
                    if (!note1.createdAt) return 1;
                    return (
                        note2.createdAt.getTime() - note1.createdAt.getTime()
                    );
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
        const foundaccessList = await NoteAccessSchema.find({
            note: noteId,
        }).lean();
        const accessList = await getAccessList(
            foundaccessList.map((x) => x.userId)
        );

        const note: Note = {
            id: foundNote._id.toString(),
            owner: foundNote.owner.toString(),
            title: foundNote.title,
            text: foundNote.text,
            tags: foundNote.tags,
            createdAt: foundNote.createdAt,
            updatedAt: foundNote.updatedAt,
            privacy: foundNote.privacy.toString() as Privacy,
            accessList,
        };

        // check if the user is can access the note
        if (!req.user || !req.user.id)
            return res.status(401).json({
                status: ResponseStatus.BAD,
                message: "User not logged in",
            });

        if (foundNote.owner.toString() !== req.user.id) {
            // check if the user can access the note

            const foundAccess = await NoteAccessSchema.findOne({
                user: req.user.id,
                note: noteId,
            });

            if (!foundAccess) {
                const resBody: ResponseBody = {
                    status: ResponseStatus.BAD,
                    message: "User not authorized to access this note",
                };

                return res.status(401).json(resBody);
            }
        }

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
        const privacyStr = req.query.privacy as string | undefined;

        if (!inputTitle || !inputText)
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Invalid body: 'title' and 'text' required",
            });

        if (
            !privacyStr ||
            !["public", "protected", "private"].includes(privacyStr)
        )
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message:
                    "Invalid privacy: should be 'public', 'protected' or 'private'",
            });

        // list of user ids
        const accessListStr = req.query.accessList as string[] | undefined;

        var accessList: Types.ObjectId[] = [];
        if (!accessListStr) accessList = [];
        else
            for (const id of accessListStr) {
                if (!Types.ObjectId.isValid(id))
                    return res.status(400).json({
                        status: ResponseStatus.BAD,
                        message: "Invalid user id",
                    });

                const user = await UserSchema.findById(id);
                if (!user)
                    return res.status(400).json({
                        status: ResponseStatus.BAD,
                        message: "Invalid user id",
                    });

                accessList.push(user._id);
            }

        if (!req.user || !req.user.id) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "User not logged in",
            });
        }

        const privacy: Privacy = privacyStr as Privacy;

        if (privacy === Privacy.PRIVATE && accessList.length > 0)
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Access list is private, but access list is not empty",
            });

        const newAccessList = await getAccessList(accessList);
        const newNote: Note = {
            owner: new ObjectId(req.user.id),
            title: inputTitle,
            text: inputText,
            tags: inputTags,
            privacy,
            accessList: newAccessList,
        };

        const createdNote = await NoteSchema.create(newNote);
        const createdAccessList = await NoteAccessSchema.insertMany(
            accessList.map((x) => ({ userId: x, noteId: createdNote._id }))
        );

        console.log("Inserted note: ", createdNote._id.toString());
        console.log("Inserted access list: ", createdAccessList);

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

    try {
        // TODO: validate param
        // TODO: validate body fields
        const inputTitle = req.body.title as string | undefined;
        const inputText = req.body.text as string | undefined;
        const inputTags = req.body.tags as string[] | undefined;
        const inputAccessList = req.body.accessList as UserResult[] | undefined;
        const inputPrivacyStr = req.body.privacy as string | undefined;

        if (
            !inputTitle &&
            !inputText &&
            !inputTags &&
            !inputAccessList &&
            !inputPrivacyStr
        ) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message:
                    "Invalid body: 'title', 'text', 'tags', 'accessList' or 'privacy' required, nothing to update",
            });
        }

        if (
            inputPrivacyStr &&
            !Object.values(Privacy).includes(inputPrivacyStr as Privacy)
        ) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message:
                    "Invalid privacy: should be 'public', 'protected' or 'private'",
            });
        }

        const foundNote = await NoteSchema.findById(noteId).lean();

        if (!foundNote) {
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
        if (
            inputPrivacy === Privacy.PUBLIC &&
            foundNote.privacy === Privacy.PUBLIC
        ) {
            if (inputAccessList && inputAccessList.length > 0) {
                return res.status(400).json({
                    status: ResponseStatus.BAD,
                    message:
                        "Access list is public, but access list is not empty",
                });
            }
        }
        // was private, remains private: validate that no input access list is defined
        if (
            inputPrivacy === Privacy.PRIVATE &&
            foundNote.privacy === Privacy.PRIVATE
        ) {
            if (inputAccessList && inputAccessList.length > 0) {
                return res.status(400).json({
                    status: ResponseStatus.BAD,
                    message:
                        "Access list is private, but access list is not empty",
                });
            }
        }

        // was protected, remains protected: use new access list, if defined
        if (
            inputPrivacy === Privacy.PROTECTED &&
            inputPrivacy === foundNote.privacy
        ) {
            if (inputAccessList && inputAccessList.length > 0) {
                console.log("Input access list: ", inputAccessList);
                for (const userItem of inputAccessList) {
                    const user = await UserSchema.findById(userItem.id);
                    if (!user) {
                        return res.status(400).json({
                            status: ResponseStatus.BAD,
                            message: "Invalid user id: " + userItem.id,
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
                for (const userItem of inputAccessList) {
                    const user = await UserSchema.findById(userItem.id);
                    if (!user) {
                        return res.status(400).json({
                            status: ResponseStatus.BAD,
                            message: "Invalid user id: " + userItem.id,
                        });
                    }
                    updatedAccessList.push(user._id);
                }
        }

        // Was private, becomes public (do nothing)
        if (
            inputPrivacy === Privacy.PUBLIC &&
            foundNote.privacy === Privacy.PRIVATE
        ) {
        }

        // Was protected, becomes private (empty access list)
        if (
            inputPrivacy === Privacy.PRIVATE &&
            foundNote.privacy === Privacy.PROTECTED
        ) {
        }

        // Was protected, becomes public (empty access list)
        if (
            inputPrivacy === Privacy.PUBLIC &&
            foundNote.privacy === Privacy.PROTECTED
        ) {
        }

        // Was public, becomes protected (create access list)
        if (
            inputPrivacy === Privacy.PROTECTED &&
            foundNote.privacy === Privacy.PUBLIC
        ) {
            if (inputAccessList && inputAccessList.length > 0)
                for (const userItem of inputAccessList) {
                    const user = await UserSchema.findById(userItem.id);
                    if (!user) {
                        return res.status(400).json({
                            status: ResponseStatus.BAD,
                            message: "Invalid user id: " + userItem.id,
                        });
                    }
                    updatedAccessList.push(user._id);
                }
        }

        // Was public, becomes private (do nothing, empty access list)
        if (
            inputPrivacy === Privacy.PRIVATE &&
            foundNote.privacy === Privacy.PUBLIC
        ) {
        }

        const newAccessList = await getAccessList(updatedAccessList);

        const updatedNote: Note = {
            owner: foundNote.owner,
            title: inputTitle || foundNote.title,
            text: inputText || foundNote.text,
            tags: inputTags || foundNote.tags,
            privacy: inputPrivacy || (foundNote.privacy as Privacy),
            accessList: newAccessList,
        };

        console.log("Updating note: ", foundNote, " to ", updatedNote);

        await NoteSchema.findByIdAndUpdate(noteId, updatedNote);

        await NoteAccessSchema.deleteMany({
            note: noteId,
        });
        await NoteAccessSchema.insertMany(
            newAccessList.map((user) => ({
                noteId: noteId,
                userId: user.id,
            }))
        );

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
