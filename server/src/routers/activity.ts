import { Request, Response, Router } from "express";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import UserSchema from "../schemas/User.js";
import { Types } from "mongoose";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { ActivitySchema } from "../schemas/Activity.js";
import type Activity from "../types/Activity.js";
// import { validDateString } from "../lib.js";

const router: Router = Router();

const DEFAULT_GET_NUMBER = 10;

// Returns the activity list for the current user; defaults to first ten items
router.get("/", async (req: Request, res: Response) => {
    try {
        // TODO: validate param
        const countStr = req.query.count as string;
        const fromStr = req.query.from as string;

        const count = parseInt(countStr) || DEFAULT_GET_NUMBER;
        const from = parseInt(fromStr) || 0;

        if (count < 0 || from < 0)
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Invalid body: 'count' and 'from' must be positive",
            });

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                status: ResponseStatus.BAD,
                message: "User not authenticated",
            });
        }

        const filter = {
            owner: req.user.id,
        };

        // TODO: filter per logged user
        const foundActivities = await ActivitySchema.find(filter).lean();
        const activities = [];

        for (const activity of foundActivities) {
            const newActivity: Activity = {
                id: activity._id.toString(),
                owner: activity.owner,
                title: activity.title,
                description: activity.description || "",
                createdAt: activity.createdAt,
                updatedAt: activity.updatedAt,
                deadline: activity.deadline,
                completed: activity.completed,
                accessList: activity.accessList,
            };

            activities.push(newActivity);
        }

        // return only count activities, starting from from
        const sortedActivities = activities.sort((a, b) => {
            return a.deadline.getTime() - b.deadline.getTime();
        });

        sortedActivities.splice(from, count);

        return res
            .status(200)
            .json({ status: ResponseStatus.GOOD, value: sortedActivities });
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        return res.status(500).json(resBody);
    }
});

//ottieni le attività dell'owner
router.get("/owner", async (req: Request, res: Response) => {
    const ownerId = req.query.owner as string; //ottieni l'owner
    //  console.log("questo è l'owner passato come query:" + ownerId);

    try {
        //Controllo se l'owner è stato inserito
        if (!ownerId) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Owner è la stringa vuota",
            });
        }

        const foundDBActivities = await ActivitySchema.find({
            owner: ownerId,
        }).lean();

        if (foundDBActivities.length === 0) {
            const resBody: ResponseBody = {
                message:
                    "L'attività con l'owner" +
                    ownerId +
                    " Non è stato trovato!",
                status: ResponseStatus.BAD,
            };

            return res.status(400).json(resBody);
        }

        // console.log("Eventi trovati: ", foundDBEvents);

        // TODO: filter the fields of the found event
        const resBody: ResponseBody = {
            message: "Attività ottenuta dal database",
            status: ResponseStatus.GOOD,
            value: foundDBActivities,
        };

        return res.json(resBody);
    } catch (e) {
        // console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        return res.status(500).json(resBody);
    }
});

//elimina attività
router.post("/deleteActivity", async (req: Request, res: Response) => {
    // console.log("Richiesta ricevuta per eliminare evento");

    const { activity_id } = req.body;
    try {
        console.log("id Attività da eliminare:", activity_id);
        const attivitaEliminata = await ActivitySchema.find({
            _id: new mongoose.Types.ObjectId(activity_id),
        });
        console.log("attività eliminata:", attivitaEliminata);

        await ActivitySchema.deleteOne({
            _id: new mongoose.Types.ObjectId(activity_id),
        });

        const resBody = {
            message: "Attività eliminata con successo",
            status: "success",
            value: attivitaEliminata,
        };
        console.log("Attività eliminata:", attivitaEliminata);

        return res.json(resBody);
    } catch (e) {
        const resBody = {
            message: "Errore nell'eliminazione dell'attività",
            status: ResponseStatus.BAD,
        };
        return res.json(resBody);
    }
});

router.post("/completeActivity", async (req: Request, res: Response) => {
    // console.log("Richiesta ricevuta per eliminare evento");

    const { activity_id } = req.body;
    try {
        console.log("id Attività da completare:", activity_id);
        const attivitaCompletata = await ActivitySchema.find({
            _id: new mongoose.Types.ObjectId(activity_id),
        });
        console.log("attività completata:", attivitaCompletata);

        await ActivitySchema.updateOne(
            {
                _id: new mongoose.Types.ObjectId(activity_id),
            },
            { completed: true, completedAt: new Date() }
        );

        const resBody = {
            message: "Attività completata con successo",
            status: "success",
            value: attivitaCompletata,
        };
        console.log("Attività completata:", attivitaCompletata);

        return res.json(resBody);
    } catch (e) {
        const resBody = {
            message: "Errore nel completamento dell'attività",
            status: ResponseStatus.BAD,
        };
        return res.json(resBody);
    }
});

router.get("/:id", async (req: Request, res: Response) => {
    const activityId = req.params.id as string;

    try {
        // TODO: validate param
        // TODO: validate body fields

        try {
            new ObjectId(activityId);
        } catch (e) {
            const resBody: ResponseBody = {
                message: "Activity with id " + activityId + " not found!",
                status: ResponseStatus.BAD,
            };

            return res.status(400).json(resBody);
        }

        const foundActivity = await ActivitySchema.findById(activityId).lean();

        if (!foundActivity) {
            const resBody: ResponseBody = {
                message: "Activity with id " + foundActivity + " not found!",
                status: ResponseStatus.BAD,
            };

            return res.status(400).json(resBody);
        }

        const activity: Activity = {
            id: foundActivity._id.toString(),
            owner: foundActivity.owner,
            title: foundActivity.title,
            description: foundActivity.description || "",
            // tags: foundActivity.tags,
            createdAt: foundActivity.createdAt,
            updatedAt: foundActivity.updatedAt,
            accessList: foundActivity.accessList,
            deadline: foundActivity.deadline,
            completed: foundActivity.completed,
            completedAt:
                foundActivity.completedAt === null
                    ? undefined
                    : foundActivity.completedAt,
        };

        if (!req.user || !req.user.id)
            return res.status(401).json({
                status: ResponseStatus.BAD,
                message: "User not logged in",
            });

        // check if the user can access the activity: owner or in the access list
        if (activity.owner.toString() !== req.user.id) {
            if (!activity.accessList.includes(req.user.id)) {
                const resBody: ResponseBody = {
                    status: ResponseStatus.BAD,
                    message: "User not authorized to access this activity",
                };

                return res.status(401).json(resBody);
            }
        }

        // TODO: filter the fields of the found note
        const resBody: ResponseBody = {
            status: ResponseStatus.GOOD,
            value: activity,
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

router.post("/", async (req: Request, res: Response) => {
    console.log("SONO ENTRATO NELLA POST DELLE ATTIVITA'!");
    try {
        // TODO: validate note input
        // TODO: validate body fields
        const title = req.body.title as String;
        const description = req.body.description as String;
        const accessList = req.body.accessList as String[];
        const deadline = req.body.deadline;
        const deadlineDate = new Date(deadline);
        const owner = req.body.owner as String;
        const idEventoNotificaCondiviso = req.body.idEventoNotificaCondiviso as String;

        console.log("ID EVENTO NOTIFICA CONDIVISOOOOOOOOOOOOOOOOOO:", idEventoNotificaCondiviso);
        const newActivity: Activity = {
            idEventoNotificaCondiviso,
            owner,
            title,
            description,
            deadline: new Date(deadlineDate.getTime()),
            accessList,
            completed: false,
            completedAt: undefined,
        };

        const createdActivity = await ActivitySchema.create(newActivity);

        console.log("Inserted activity: ", createdActivity);

        const resBody: ResponseBody = {
            message: "Note inserted into database",
            status: ResponseStatus.GOOD,
            value: createdActivity._id.toString(),
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

router.put("/:id", async (req: Request, res: Response) => {
    const activityId = req.params.id as string;

    try {
        // TODO: validate param
        // TODO: validate body fields
        const inputTitle = req.body.title as string | undefined;
        const inputDescription = req.body.description as string | undefined;
        const inputDeadline = req.body.deadline as string | undefined;
        const inputCompleted = req.body.completed as string | undefined;
        const inputTags = req.body.tags as string[] | undefined;
        const inputAccessList = req.body.accessList as string[] | undefined;

        if (
            !inputTitle &&
            !inputDescription &&
            !inputDeadline &&
            !inputCompleted &&
            !inputTags &&
            !inputAccessList
        ) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message:
                    "Invalid body: 'title', 'description', 'deadline', 'completed', 'tags' or 'accessList' required, nothing to update",
            });
        }

        const foundActivity = await ActivitySchema.findById(activityId).lean();

        if (!foundActivity) {
            const resBody: ResponseBody = {
                message: "Activity with id " + activityId + " not found!",
                status: ResponseStatus.BAD,
            };

            return res.status(400).json(resBody);
        }

        const updatedAccessList: Types.ObjectId[] = [];

        if (inputAccessList)
            for (const id of inputAccessList) {
                if (!Types.ObjectId.isValid(id))
                    return res.status(400).json({
                        status: ResponseStatus.BAD,
                        message: "Invalid user id",
                    });

                const user = await UserSchema.findById(id);
                if (!user)
                    return res.status(400).json({
                        status: ResponseStatus.BAD,
                        message: "Invalid user id: " + id,
                    });

                updatedAccessList.push(user._id);
            }

        if (inputCompleted && !["true", "false"].includes(inputCompleted)) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message:
                    "Invalid body: 'completed' should be 'true' or 'false'",
            });
        }
        const updatedDeadline: Date | undefined = inputDeadline
            ? new Date(inputDeadline)
            : undefined;

        const updatedActivity: Activity = {
            owner: foundActivity.owner,
            title: inputTitle || foundActivity.title,
            description: inputDescription || foundActivity.description,
            // tags: inputTags || foundActivity.tags,
            accessList:
                updatedAccessList.map((id) => id.toString()) ||
                foundActivity.accessList,
            deadline: updatedDeadline || foundActivity.deadline,
            completed: !!inputCompleted || foundActivity.completed,
            completedAt: inputCompleted ? new Date() : undefined,
        };

        console.log(
            "Updating activity: ",
            foundActivity,
            " to ",
            updatedActivity
        );

        const result = await ActivitySchema.findByIdAndUpdate(
            activityId,
            updatedActivity
        );

        // TODO: filter the fields of the found note
        const resBody: ResponseBody = {
            message: "Note updated in database",
            status: ResponseStatus.GOOD,
            value: result,
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
    const activityId = req.params.id as string;

    try {
        // TODO: validate param
        // TODO: validate body fields

        const foundActivity = await ActivitySchema.findByIdAndDelete(
            activityId
        );

        if (!foundActivity) {
            const resBody: ResponseBody = {
                message: "Activity with id " + activityId + " not found!",
                status: ResponseStatus.BAD,
            };

            res.status(400).json(resBody);
        }

        console.log("Deleted activity: ", foundActivity);

        // TODO: filter the fields of the found note
        const resBody: ResponseBody = {
            message: "Activity deleted from database",
            status: ResponseStatus.GOOD,
            value: foundActivity,
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
