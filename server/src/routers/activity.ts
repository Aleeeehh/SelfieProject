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
import { AdvancementType } from "../types/Activity.js";
import {
	getActivityList,
	getIdListFromUsernameList,
	getStatusForActivity,
	getUsernameListFromIdList,
} from "./lib.ts";
// import { validDateString } from "../lib.js";

const router: Router = Router();

// max positive integer
const DEFAULT_GET_NUMBER = Number.MAX_SAFE_INTEGER;

// Returns the activity list for the current user; defaults to first ten items
router.get("/", async (req: Request, res: Response) => {
	try {
		// TODO: validate param
		const countStr = req.query.count as string | undefined;
		const fromStr = req.query.from as string | undefined;

		const count = countStr ? parseInt(countStr) : DEFAULT_GET_NUMBER;
		const from = fromStr ? parseInt(fromStr) : 0;

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

		// only logged user accessible
		const filter = {
			$or: [{ owner: req.user.id }, { accessList: req.user.id }],
		};

		console.log("Filter: ", filter);

		const foundActivities = await ActivitySchema.find(filter).lean();

		// console.log("Found activities: ", foundActivities);

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
				accessList: await getUsernameListFromIdList(
					activity.accessList
				),
				projectId: activity.projectId || null,
				next: activity.next || null,
				// status: activity.status as ActivityStatus | null,
				milestone: activity.milestone,
				advancementType: activity.advancementType as AdvancementType | null,
				parent: activity.parent || null,
				start: activity.start || null,
				children: await getActivityList(activity.projectId || undefined, activity._id),
				active: activity.active,
				abandoned: activity.abandoned,
				reactivated: activity.reactivated,
			};

			newActivity.status = await getStatusForActivity(newActivity);

			activities.push(newActivity);
		}

		// return only count activities, starting from from
		const sortedActivities = activities.sort((a, b) => {
			return a.deadline.getTime() - b.deadline.getTime();
		});

		sortedActivities.filter(
			(_, index) => index >= from && index < from + count
		);

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
	var ownerId = req.query.owner as string; //ottieni l'owner
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
			accessListAccepted: ownerId, // Cerca in accessListAcceptedUser invece che per owner
		}).lean();

		console.log("SUBITO DOPO DELLA FIND:", ownerId);
		console.log("SUBITO DOPO DELLA FIND:", ownerId);
		console.log("SUBITO DOPO DELLA FIND:", ownerId);

		console.log("Attività trovate:", foundDBActivities);

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
			owner: foundActivity.owner.toString(),
			title: foundActivity.title,
			description: foundActivity.description || "",
			// tags: foundActivity.tags,
			createdAt: foundActivity.createdAt,
			updatedAt: foundActivity.updatedAt,
			accessList: await getUsernameListFromIdList(foundActivity.accessList),
			deadline: foundActivity.deadline,
			completed: foundActivity.completed,
			idEventoNotificaCondiviso: foundActivity.idEventoNotificaCondiviso || undefined,
			completedAt: foundActivity.completedAt === null ? undefined : foundActivity.completedAt,

			// Leo - Progetti - BGN
			projectId: foundActivity.projectId || null,
			advancementType: foundActivity.advancementType as AdvancementType | null,
			start: foundActivity.start || null,
			milestone: foundActivity.milestone,
			parent: foundActivity.parent || null,
			next: foundActivity.next || null,
			children: await getActivityList(
				foundActivity.projectId ? new Types.ObjectId(foundActivity.projectId) : undefined,
				foundActivity._id
			),

			active: foundActivity.active,
			abandoned: foundActivity.abandoned,
			reactivated: foundActivity.reactivated,
			status: null,
			// Leo - Progetti - END
		};

		// Leo - Progetti - BGN
		activity.status = await getStatusForActivity(activity);
		// Leo - Progetti - END

		if (!req.user || !req.user.id)
			return res.status(401).json({
				status: ResponseStatus.BAD,
				message: "User not logged in",
			});

		// check if the user can access the activity: owner or in the access list
		if (foundActivity.owner.toString() !== req.user.id) {
			if (
				!foundActivity.accessList.some((id) => id.equals(new Types.ObjectId(req.user?.id)))
			) {
				const resBody: ResponseBody = {
					status: ResponseStatus.BAD,
					message: "User not authorized to access this activity",
				};

				return res.status(401).json(resBody);
			}
		}

		console.log(activity);
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
	console.log("SONO ENTRATO NELLA POST DELLE ATTIVITA'!");

	console.log("SONO ENTRATO NELLA POST DELLE ATTIVITA'!");

	console.log("SONO ENTRATO NELLA POST DELLE ATTIVITA'!");

	console.log("SONO ENTRATO NELLA POST DELLE ATTIVITA'!");


	try {
		console.log("SONO ENTRATO NELLA POST DELLE ATTIVITA'!");
		console.log("SONO ENTRATO NELLA POST DELLE ATTIVITA'!");
	
		console.log("SONO ENTRATO NELLA POST DELLE ATTIVITA'!");
	
		console.log("SONO ENTRATO NELLA POST DELLE ATTIVITA'!");
	
		console.log("SONO ENTRATO NELLA POST DELLE ATTIVITA'!");
		// TODO: validate note input
		// TODO: validate body fields
		const title = req.body.title as string | undefined;
		const description = req.body.description as string | undefined;
		const accessList = (req.body.accessList as string[]) || []; // username list
		const deadline = req.body.deadline as string | undefined;
		const owner = req.body.owner || (req.user?.id as string) || undefined; // TODO: l'owner può non essere l'utente loggato?
		const idEventoNotificaCondiviso = req.body.idEventoNotificaCondiviso as string | undefined;
		const accessListAccepted = req.body.accessListAccepted as string[];

		// Leo - Progetti - BGN
		const projectId = req.body.projectId as string | undefined;
		const startDateStr = req.body.start as string | undefined;
		const milestone = req.body.milestone as boolean | undefined;

		var advancementType = req.body.advancementType as AdvancementType | undefined;

		const parent = req.body.parent as string | undefined;
		// const prev = req.body.prev as string | undefined;
		const next = req.body.next as string | undefined;
		const active = req.body.active as boolean | undefined;
		const abandoned = req.body.abandoned as boolean | undefined;
		const reactivated = req.body.reactivated as boolean | undefined;
		// Leo - Progetti - END

		if (!title || !description || !deadline || !owner) {
			const resBody: ResponseBody = {
				status: ResponseStatus.BAD,
				message:
					"Missing required fields: 'title', 'description', 'deadline', 'owner'",
			};
			console.log(
				"Missing required fields: 'title', 'description', 'deadline', 'owner'"
			);
			return res.status(400).json(resBody);
		}

		const deadlineDate = new Date(deadline);

		if (projectId && !Types.ObjectId.isValid(projectId)) {
			const resBody: ResponseBody = {
				status: ResponseStatus.BAD,
				message: "Invalid project id",
			};
			console.log("Invalid project id");
			return res.status(400).json(resBody);
		}

		let startDate: Date | undefined;
		let realOwner = owner;

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
					message:
						"You are not the owner of this project, cannot add activity",
				};
				console.log(
					"You are not the owner of this project, cannot add activity"
				);
				return res.status(403).json(resBody);
			}

			realOwner = project.owner.toString();

			if (!startDateStr) {
				const resBody: ResponseBody = {
					message: "Start date is required when inserting project activity",
					status: ResponseStatus.BAD,
				};
				console.log("Start date is required when inserting project activity");
				return res.status(400).json(resBody);
			}

			if (!validDateString(startDateStr)) {
				const resBody: ResponseBody = {
					message: "Invalid start date format",
					status: ResponseStatus.BAD,
				};
				console.log("Invalid start date format");
				return res.status(400).json(resBody);
			}

			startDate = new Date(startDateStr);
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

				// Allow only one level of sub-activities
				if (foundParent.parent) {
					const resBody: ResponseBody = {
						status: ResponseStatus.BAD,
						message:
							"Invalid parent id: you are attempting to create a second level sub-activity",
					};
					console.log(
						"Invalid parent id: you are attempting to create a second level sub-activity"
					);
					return res.status(400).json(resBody);
				}
			}

			//if (prev && !Types.ObjectId.isValid(prev)) {
			//	const resBody: ResponseBody = {
			//		status: ResponseStatus.BAD,
			//		message: "Invalid prev id",
			//	};
			// 	console.log("Invalid prev id");
			// 	return res.status(400).json(resBody);
			// }

			// if (prev) {
			// 	const foundPrev = await ActivitySchema.findById(prev).lean();
			// 	if (!foundPrev) {
			// 		const resBody: ResponseBody = {
			// 			status: ResponseStatus.BAD,
			// 			message: "Invalid prev id",
			// 		};
			// 		console.log("Invalid prev id");
			// 		return res.status(400).json(resBody);
			// 	}
			// }

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

				// should be of the same project
				if (
					foundNext.projectId &&
					projectId &&
					foundNext.projectId.toString() !== projectId
				) {
					const resBody: ResponseBody = {
						status: ResponseStatus.BAD,
						message: "Invalid next id: wrong project",
					};
					console.log("Invalid next id: wrong project");
					return res.status(400).json(resBody);
				}

				// should have the same parent
				if (
					(!foundNext.parent && parent) ||
					(foundNext.parent &&
						(!parent || foundNext.parent.toString() !== parent))
				) {
					const resBody: ResponseBody = {
						status: ResponseStatus.BAD,
						message: "Invalid next id: wrong parent",
					};
					console.log("Invalid next id: wrong parent");
					return res.status(400).json(resBody);
				}
			}

			if (startDateStr && !validDateString(startDateStr)) {
				const resBody: ResponseBody = {
					status: ResponseStatus.BAD,
					message: "Invalid start date: format 'YYYY-MM-DD'",
				};
				console.log("Invalid start date: format 'YYYY-MM-DD'");
				return res.status(400).json(resBody);
			}
		}
		// Leo - Progetti - END

		console.log("ID EVENTO NOTIFICA CONDIVISOOOOOOOOOOOOOOOOOO:", idEventoNotificaCondiviso);

		const newActivity: Activity = {
			idEventoNotificaCondiviso,
			// Leo - Progetti - BEGIN
			owner: realOwner,
			// Leo - Progetti - END
			title,
			description,
			deadline: deadlineDate,
			accessList: accessList,
			accessListAccepted: accessListAccepted,
			completed: false,
			completedAt: undefined,

			// Leo - Progetti - BGN
			projectId: projectId || null,
			start: startDate || null,
			milestone: milestone || null,
			parent: parent || null,
			// prev,
			next: next || null,
			status: null,
			advancementType: advancementType || null,
			children: null,

			active: active || projectId ? false : null,
			abandoned: abandoned || projectId ? false : null,
			reactivated: reactivated || projectId ? false : null,
			// Leo - Progetti - END
		};

		console.log("CREATA STRUTTURA DA INSERIRE NEL DB:", newActivity);

		const createdActivity = await ActivitySchema.create(newActivity);

		// Leo - Progetti - BGN
		// update activity sequence
		if (createdActivity.next) {
			const prevActivity = await ActivitySchema.findOne({
				next: createdActivity.next,
			}).lean();
			if (!prevActivity) {
				console.log("Prev activity not found; this is a new head");
			} else {
				await ActivitySchema.findByIdAndUpdate(prevActivity._id, {
					next: createdActivity._id,
				}).lean();
			}
		}
		// Leo - Progetti - END

		console.log("INSERITA ATTIVITA' NEL DB:", createdActivity);

		const resBody: ResponseBody = {
			message: "Activity inserted into database",
			status: ResponseStatus.GOOD,
			value: createdActivity._id.toString(),
		};

		// TODO: if projectid, send notification to access list users

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

	console.log("PUT ACTIVITY", activityId, req.body);

	try {
		// TODO: validate param
		// TODO: validate body fields
		const inputTitle = req.body.title as string | undefined;
		const inputDescription = req.body.description as string | undefined;
		const inputDeadline = req.body.deadline as string | undefined;
		const inputCompleted = req.body.completed as boolean | undefined;
		const inputAccessList = req.body.accessList as string[] | undefined; // username list
		const inputAccessListAcceptedUser = req.body.accessListAcceptedUser as Types.ObjectId[] | undefined; // username list

		// Leo - Progetti - BGN
		// cannot change projectId
		// cannot change parentActivity
		const inputStartDate = req.body.start as string | undefined;
		const inputMilestone = req.body.milestone as string | undefined;
		// const inputPrev = req.body.prev as string | undefined;
		const inputNext = req.body.next as string | undefined;
		const inputAdvancementType = req.body.advancementType as AdvancementType | undefined;
		const inputActive = req.body.active as boolean | undefined;
		const inputAbandoned = req.body.abandoned as boolean | undefined;
		const inputReactivated = req.body.reactivated as boolean | undefined;
		// Leo - Progetti - END

		if (
			!inputTitle &&
			!inputDescription &&
			!inputDeadline &&
			!inputCompleted &&
			!inputAccessList &&
			!inputAccessListAcceptedUser &&
			!inputActive &&
			!inputAbandoned &&
			!inputReactivated
		) {
			console.log(
				"Invalid body: 'title', 'description', 'deadline', 'completed', 'accessList', 'accessListAccepted', 'active', 'abandoned' or 'reactivated' required, nothing to update"
			);
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message:
					"Invalid body: 'title', 'description', 'deadline', 'completed', 'accessList', 'accessListAccepted', 'active', 'abandoned' or 'reactivated' required, nothing to update",
			});
		}

		// Controlla se l'activityId è una stringa valida per ObjectId
		const isValidObjectId = Types.ObjectId.isValid(activityId);
		const query = isValidObjectId
			? { $or: [{ _id: new Types.ObjectId(activityId) }, { idEventoNotificaCondiviso: activityId }] }
			: { idEventoNotificaCondiviso: activityId };

		const foundActivity = await ActivitySchema.findOne(query).lean();

		if (!foundActivity) {
			console.log("Activity with id " + activityId + " not found!");
			const resBody: ResponseBody = {
				message: "Activity with id " + activityId + " not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		const projectId = foundActivity.projectId;

		const updatedAccessList: Types.ObjectId[] = [];

		if (inputAccessList) {
			for (const id of inputAccessList) {
				const foundUser = await UserSchema.findOne({ username: id });

				if (!foundUser) {
					console.log("Invalid username: " + id);
					return res.status(400).json({
						status: ResponseStatus.BAD,
						message: "Invalid username",
					});
				}

				updatedAccessList.push(foundUser._id);
			}
		}

		let updatedAccessListAccepted: Types.ObjectId[] | undefined;
		if (inputAccessListAcceptedUser) {
			updatedAccessListAccepted =
				foundActivity.accessListAccepted?.concat(
					inputAccessListAcceptedUser
				);
		}

		console.log("updatedAccessListAccepted:", updatedAccessListAccepted);
		console.log("updatedAccessListAccepted:", updatedAccessListAccepted);

		console.log("updatedAccessListAccepted:", updatedAccessListAccepted);


		const updatedCompleted: boolean | undefined = inputCompleted
			? !!inputCompleted
			: foundActivity.completed;

		const updatedDeadline: Date | undefined = inputDeadline
			? new Date(inputDeadline)
			: undefined;

		// Leo - Progetti - BGN

		if (projectId && inputStartDate && !validDateString(inputStartDate)) {
			console.log("Invalid start date");
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid start date",
			});
		}

		const updatedStartDate: Date | undefined = projectId
			? inputStartDate
				? new Date(inputStartDate)
				: new Date(foundActivity.start || "")
			: undefined;

		//console.log(updatedStartDate);

		const updatedMilestone: boolean | undefined = projectId
			? inputMilestone
				? !!inputMilestone
				: foundActivity.milestone
			: undefined;

		//if (projectId && inputPrev && !Types.ObjectId.isValid(inputPrev) && inputPrev) {
		//	console.log("Invalid prev id");
		//	return res.status(400).json({
		//		status: ResponseStatus.BAD,
		//		message: "Invalid prev id",
		//	});
		//}

		if (projectId && inputNext && !Types.ObjectId.isValid(inputNext)) {
			console.log("Invalid next id");
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid next id",
			});
		}

		if (projectId && inputNext) {
			const foundNext = await ActivitySchema.findById(inputNext).lean();
			if (!foundNext) {
				console.log("Invalid next id");
				return res.status(400).json({
					status: ResponseStatus.BAD,
					message: "Invalid next id",
				});
			}

			// should be of the same project
			if (
				foundNext.projectId &&
				foundNext.projectId.toString() !== projectId.toString()
			) {
				const resBody: ResponseBody = {
					status: ResponseStatus.BAD,
					message: "Invalid next id: wrong project",
				};
				console.log("Invalid next id: wrong project");
				return res.status(400).json(resBody);
			}

			// should have the same parent
			if (
				(!foundNext.parent && foundActivity.parent) ||
				(foundNext.parent &&
					(!foundActivity.parent ||
						foundNext.parent.toString() !==
						foundActivity.parent.toString()))
			) {
				const resBody: ResponseBody = {
					status: ResponseStatus.BAD,
					message: "Invalid next id: wrong parent",
				};
				console.log("Invalid next id: wrong parent");
				return res.status(400).json(resBody);
			}
		}

		//const updatedPrev: Types.ObjectId | null | undefined = projectId
		//	? inputPrev
		//		? new Types.ObjectId(inputPrev)
		//		: foundActivity.prev
		// 	: undefined;
		const updatedNext: Types.ObjectId | null | undefined = projectId
			? inputNext
				? new Types.ObjectId(inputNext)
				: foundActivity.next
			: undefined;

		const updateAdvancementType: AdvancementType | undefined = projectId
			? inputAdvancementType
			: (foundActivity.advancementType as AdvancementType | undefined);

		if (!projectId && (inputActive || inputAbandoned || inputReactivated)) {
			const resBody: ResponseBody = {
				status: ResponseStatus.BAD,
				message:
					"Cannot change active, abandoned or reactivated for non-project activity",
			};
			console.log(
				"Cannot change active, abandoned or reactivated for non-project activity"
			);
			return res.status(400).json(resBody);
		}

		if (
			inputReactivated &&
			req.user?.id !== foundActivity.owner.toString()
		) {
			const resBody: ResponseBody = {
				status: ResponseStatus.BAD,
				message: "Only the owner can change 'reactivate' activity",
			};
			console.log("Only the owner can change 'reactivate' activity");
			return res.status(400).json(resBody);
		}

		// Leo - Progetti - END

		console.log("updatedAccessListAccepted:", updatedAccessListAccepted);

		const updatedActivity: Activity = {
			owner: foundActivity.owner.toString(),
			title: inputTitle || foundActivity.title,
			description: inputDescription || foundActivity.description,
			accessList: inputAccessList
				? updatedAccessList.map((id) => id.toString())
				: foundActivity.accessList,
			deadline: updatedDeadline || foundActivity.deadline,
			completed: updatedCompleted,
			completedAt: inputCompleted ? new Date() : undefined,
			accessListAccepted: updatedAccessListAccepted || foundActivity.accessListAccepted,
			idEventoNotificaCondiviso: foundActivity.idEventoNotificaCondiviso || undefined,

			// Leo - Progetti - BGN
			projectId: foundActivity.projectId || null,
			advancementType: updateAdvancementType || null,
			start: updatedStartDate || null,
			milestone: updatedMilestone || null,
			parent: foundActivity.parent || null,
			// prev: updatedPrev || undefined,
			next: updatedNext || null,
			children: await getActivityList(
				foundActivity.projectId ? new Types.ObjectId(foundActivity.projectId) : undefined,
				foundActivity._id
			),
			status: null,

			active: inputActive || foundActivity.active,
			abandoned: inputAbandoned || foundActivity.abandoned,
			reactivated: inputReactivated || foundActivity.reactivated,
			// Leo - Progetti - END
		};

		// updatedActivity.status = await getStatusForUpdatedActivity(updatedActivity);

		console.log("Updating activity: ", foundActivity, " to ", updatedActivity);

		const result = await ActivitySchema.findByIdAndUpdate(activityId, updatedActivity);

		if (projectId && inputNext) {
			// set prev next to null, and update to new next
			const foundPreviuosNext = await ActivitySchema.findById(foundActivity.next).lean();
			if (foundPreviuosNext) {
				foundPreviuosNext.next = null;
				await ActivitySchema.findByIdAndUpdate(foundPreviuosNext._id, foundPreviuosNext);
			}
		}

		const resBody: ResponseBody = {
			message: "Note updated in database",
			status: ResponseStatus.GOOD,
			value: result,
		};

		// TODO: if projectid, send notification to access list users

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

// Delete recursively children activities
async function deleteActivity(activityId: string): Promise<number> {
	const deletedActivity = await ActivitySchema.findByIdAndDelete(activityId);

	if (!deletedActivity) {
		console.log("Activity not found while deleting:", activityId);
		return 0;
	}

	var count = 1;
	const foundChildren = await ActivitySchema.find({ parent: activityId });
	for (const child of foundChildren) {
		count = count + (await deleteActivity(child._id.toString()));
	}

	return count;
}

router.delete("/:id", async (req: Request, res: Response) => {
	const activityId = req.params.id as string;

	try {
		// TODO: validate param
		// TODO: validate body fields

		// Leo - Progetti - BEGIN
		const foundActivity = await ActivitySchema.findById(activityId).lean();

		if (!foundActivity) {
			console.log("Activity with id " + activityId + " not found!");
			const resBody: ResponseBody = {
				message: "Activity with id " + activityId + " not found!",
				status: ResponseStatus.BAD,
			};

			return res.status(400).json(resBody);
		}

		const count = await deleteActivity(activityId);

		console.log("Deleted ", count, "activities");

		// update next field for prev activity
		const foundPreviuos = await ActivitySchema.findOne({
			next: foundActivity._id,
		}).lean();

		if (foundPreviuos) {
			foundPreviuos.next = null;
			console.log(
				"Eliminato il riferimento 'next' per l'attività eliminata, attività precedente:",
				foundPreviuos._id.toString()
			);
			await ActivitySchema.findByIdAndUpdate(
				foundPreviuos._id,
				foundPreviuos
			);
		}

		// Leo - Progetti - END

		// TODO: filter the fields of the found note
		const resBody: ResponseBody = {
			message: "Activity Deleted " + count + " from database.",
			status: ResponseStatus.GOOD,
			value: foundActivity._id.toString(),
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

export default router;
