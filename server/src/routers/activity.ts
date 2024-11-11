import { Request, Response, Router } from "express";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import UserSchema from "../schemas/User.js";
import { Types } from "mongoose";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { ActivitySchema } from "../schemas/Activity.js";
import type Activity from "../types/Activity.js";
import { validDateString } from "../lib.ts";
import { ProjectSchema } from "../schemas/Project.ts";
import { AdvancementType, ActivityStatus } from "../types/Activity.js";
// import { validDateString } from "../lib.js";

const router: Router = Router();

const DEFAULT_GET_NUMBER = 10;

// Returns only statuses: ACTIVABLE, NOT_ACTIVABLE, LATE
async function getStatusForCreatedActivity(activity: Activity): Promise<ActivityStatus> {
	var activable = false;
	var late = false;

	// if no prev activity, the current is activable
	if (!activity.prev) activable = true;

	const prevActivity = await ActivitySchema.findById(activity.prev).lean();
	if (!prevActivity) activable = true;

	// if prev activity is completed, the current is activable
	if (prevActivity && prevActivity.completed) activable = true;

	// if activity is activable, check if it is late
	if (activable) {
		if (activity.deadline.getTime() < new Date().getTime()) {
			late = true;
		}
	}

	// return the value for the status
	if (activable && late) {
		return ActivityStatus.LATE;
	} else if (activable) {
		return ActivityStatus.ACTIVABLE;
	} else {
		return ActivityStatus.NOT_ACTIVABLE;
	}
}

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
				owner: activity.owner.toString(),
				title: activity.title,
				description: activity.description || "",
				createdAt: activity.createdAt,
				updatedAt: activity.updatedAt,
				deadline: activity.deadline,
				completed: activity.completed,
				accessList: activity.accessList.map((id) => id.toString()),
			};

			activities.push(newActivity);
		}

		// return only count activities, starting from from
		const sortedActivities = activities.sort((a, b) => {
			return a.deadline.getTime() - b.deadline.getTime();
		});

		sortedActivities.splice(from, count);

		return res.status(200).json({ status: ResponseStatus.GOOD, value: sortedActivities });
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
		console.log("Questo è l'owner passato come query alla get delle attività:", ownerId);
		console.log("Questo è l'owner passato come query alla get delle attività:", ownerId);
		console.log("Questo è l'owner passato come query alla get delle attività:", ownerId);
		console.log("Questo è l'owner passato come query alla get delle attività:", ownerId);
		console.log("Questo è l'owner passato come query alla get delle attività:", ownerId);

		//Controllo se l'owner è stato inserito
		if (!ownerId) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Owner è la stringa vuota",
			});
		}

		console.log("SUBITO PRIMA DELLA FIND:", ownerId);
		console.log("SUBITO PRIMA DELLA FIND:", ownerId);
		console.log("SUBITO PRIMA DELLA FIND:", ownerId);
		console.log("SUBITO PRIMA DELLA FIND:", ownerId);

		const foundDBActivities = await ActivitySchema.find({
			accessList: ownerId, // Cerca in accessList invece che per owner
		}).lean();

		console.log("SUBITO DOPO DELLA FIND:", ownerId);
		console.log("SUBITO DOPO DELLA FIND:", ownerId);
		console.log("SUBITO DOPO DELLA FIND:", ownerId);

		console.log("Attività trovate:", foundDBActivities);

		if (foundDBActivities.length === 0) {
			const resBody: ResponseBody = {
				message: "L'attività con l'owner" + ownerId + " Non è stato trovato!",
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
			owner: foundActivity.owner.toString(),
			title: foundActivity.title,
			description: foundActivity.description || "",
			// tags: foundActivity.tags,
			createdAt: foundActivity.createdAt,
			updatedAt: foundActivity.updatedAt,
			accessList: foundActivity.accessList.map((id) => id.toString()),
			deadline: foundActivity.deadline,
			completed: foundActivity.completed,
			idEventoNotificaCondiviso: foundActivity.idEventoNotificaCondiviso || undefined,
			completedAt: foundActivity.completedAt === null ? undefined : foundActivity.completedAt,
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
		const title = req.body.title as string;
		const description = req.body.description as string;
		const accessList = req.body.accessList as string[];
		const deadline = req.body.deadline;
		const deadlineDate = new Date(deadline);
		const owner = req.body.owner || (req.user?.id as string); // TODO: l'owner può non essere l'utente loggato?
		const idEventoNotificaCondiviso = req.body.idEventoNotificaCondiviso as string;

		// Leo - Progetti - BGN
		const projectId = req.body.projectId as string | undefined;
		const startDateStr = req.body.start as string | undefined;
		const milestone = req.body.milestone as boolean | undefined;

		var advancementType = req.body.advancementType as AdvancementType | undefined;

		const parent = req.body.parent as string | undefined;
		const prev = req.body.prev as string | undefined;
		const next = req.body.next as string | undefined;

		if (startDateStr && !validDateString(startDateStr)) {
			const resBody: ResponseBody = {
				status: ResponseStatus.BAD,
				message: "Invalid start date: format 'YYYY-MM-DD'",
			};
			console.log("Invalid start date: format 'YYYY-MM-DD'");
			return res.status(400).json(resBody);
		}

		if (projectId && !Types.ObjectId.isValid(projectId)) {
			const resBody: ResponseBody = {
				status: ResponseStatus.BAD,
				message: "Invalid project id",
			};
			console.log("Invalid project id");
			return res.status(400).json(resBody);
		}

		if (projectId) {
			const project = await ProjectSchema.findById(projectId).lean();
			if (!project) {
				const resBody: ResponseBody = {
					status: ResponseStatus.BAD,
					message: "Invalid project id",
				};
				console.log("Invalid project id");
				return res.status(400).json(resBody);
			}

			if (project.owner.toString() !== owner) {
				const resBody: ResponseBody = {
					status: ResponseStatus.BAD,
					message: "You are not the owner of this project, cannot add activity",
				};
				console.log("You are not the owner of this project, cannot add activity");
				return res.status(403).json(resBody);
			}
		}

		const startDate = new Date(startDateStr || "");
		if (startDate.getTime() > deadlineDate.getTime()) {
			const resBody: ResponseBody = {
				status: ResponseStatus.BAD,
				message: "Start date cannot be after deadline",
			};
			console.log("Start date cannot be after deadline");
			return res.status(400).json(resBody);
		}

		if (advancementType && !Object.values(AdvancementType).includes(advancementType)) {
			const resBody: ResponseBody = {
				status: ResponseStatus.BAD,
				message: "Invalid advancement type",
			};
			console.log("Invalid advancement type");
			return res.status(400).json(resBody);
		}

		if (parent && !Types.ObjectId.isValid(parent)) {
			const resBody: ResponseBody = {
				status: ResponseStatus.BAD,
				message: "Invalid parent id",
			};
			console.log("Invalid parent id");
			return res.status(400).json(resBody);
		}

		if (parent) {
			const foundParent = await ActivitySchema.findById(parent).lean();
			if (!foundParent) {
				const resBody: ResponseBody = {
					status: ResponseStatus.BAD,
					message: "Invalid parent id",
				};
				console.log("Invalid parent id");
				return res.status(400).json(resBody);
			}
		}

		if (prev && !Types.ObjectId.isValid(prev)) {
			const resBody: ResponseBody = {
				status: ResponseStatus.BAD,
				message: "Invalid prev id",
			};
			console.log("Invalid prev id");
			return res.status(400).json(resBody);
		}

		if (prev) {
			const foundPrev = await ActivitySchema.findById(prev).lean();
			if (!foundPrev) {
				const resBody: ResponseBody = {
					status: ResponseStatus.BAD,
					message: "Invalid prev id",
				};
				console.log("Invalid prev id");
				return res.status(400).json(resBody);
			}
		}

		if (next && !Types.ObjectId.isValid(next)) {
			const resBody: ResponseBody = {
				status: ResponseStatus.BAD,
				message: "Invalid next id",
			};
			console.log("Invalid next id");
			return res.status(400).json(resBody);
		}

		if (next) {
			const foundNext = await ActivitySchema.findById(next).lean();
			if (!foundNext) {
				const resBody: ResponseBody = {
					status: ResponseStatus.BAD,
					message: "Invalid next id",
				};
				console.log("Invalid next id");
				return res.status(400).json(resBody);
			}
		}

		// Leo - Progetti - END

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

			// Leo - Progetti - BGN
			projectId,
			start: startDate,
			milestone,
			advancementType,
			parent,
			prev,
			next,
			// Leo - Progetti - END
		};

		// Leo - Progetti - BGN
		newActivity.status = await getStatusForCreatedActivity(newActivity);
		console.log(owner, startDate, req.user?.id);
		// Leo - Progetti - END

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

		// Leo - Progetti - BGN
		// cannot change projectId
		// cannot change parentActivity
		const inputStartDate = req.body.startDate as string | undefined;
		const inputMilestone = req.body.milestone as string | undefined;
		const inputPrev = req.body.prev as string | undefined;
		const inputNext = req.body.next as string | undefined;
		// Leo - Progetti - END

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
				message: "Invalid body: 'completed' should be 'true' or 'false'",
			});
		}
		const updatedDeadline: Date | undefined = inputDeadline
			? new Date(inputDeadline)
			: undefined;

		// Leo - Progetti - BGN

		if (inputStartDate && !validDateString(inputStartDate)) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid start date",
			});
		}

		const updatedStartDate: Date | undefined = inputStartDate
			? new Date(inputStartDate)
			: new Date(foundActivity.start || "");

		const updatedMilestone: boolean = inputMilestone
			? !!inputMilestone
			: foundActivity.milestone;

		if (inputPrev && !Types.ObjectId.isValid(inputPrev) && inputPrev) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid prev id",
			});
		}

		if (inputNext && !Types.ObjectId.isValid(inputNext)) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid next id",
			});
		}

		const updatedPrev: Types.ObjectId | null | undefined = inputPrev
			? new Types.ObjectId(inputPrev)
			: foundActivity.prev;
		const updatedNext: Types.ObjectId | null | undefined = inputNext
			? new Types.ObjectId(inputNext)
			: foundActivity.next;

		// Leo - Progetti - END

		const updatedActivity: Activity = {
			owner: foundActivity.owner.toString(),
			title: inputTitle || foundActivity.title,
			description: inputDescription || foundActivity.description,
			// tags: inputTags || foundActivity.tags,
			accessList: updatedAccessList.map((id) => id.toString()) || foundActivity.accessList,
			deadline: updatedDeadline || foundActivity.deadline,
			completed: !!inputCompleted || foundActivity.completed,
			completedAt: inputCompleted ? new Date() : undefined,

			// Leo - Progetti - BGN
			projectId: foundActivity.projectId || undefined,
			start: updatedStartDate,
			milestone: updatedMilestone,
			parent: foundActivity.parent || undefined,
			prev: updatedPrev || undefined,
			next: updatedNext || undefined,
			// Leo - Progetti - END
		};

		console.log("Updating activity: ", foundActivity, " to ", updatedActivity);

		const result = await ActivitySchema.findByIdAndUpdate(activityId, updatedActivity);

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

		const foundActivity = await ActivitySchema.findByIdAndDelete(activityId);

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
