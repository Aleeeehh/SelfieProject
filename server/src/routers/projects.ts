import { Request, Response, Router } from "express";
import type { ResponseBody } from "../types/ResponseBody.ts";
import { ResponseStatus } from "../types/ResponseStatus.ts";
import { ProjectSchema } from "../schemas/Project.ts";
import type Project from "../types/Project.ts";
import NoteSchema from "../schemas/Note.ts";
import type Note from "../types/Note.ts";
// import type UserResult from "../types/UserResult.ts";
import UserSchema from "../schemas/User.ts";
import mongoose, { Types } from "mongoose";
import type { Privacy } from "../types/Privacy.ts";
import { getActivityList, getIdListFromUsernameList, getUsernameListFromIdList } from "./lib.ts";
import NotificationSchema, { NotificationType } from "../schemas/Notification.ts";
import type Notification from "../types/Notification.ts";

const router: Router = Router();

// async function getProjectById(id: string): Promise<Project> {}

// returns all projects where the current user is the owner or in the access list
router.get("/", async (req: Request, res: Response) => {
	try {
		if (!req.user || !req.user.id) {
			const response: ResponseBody = {
				message: "error",
				status: ResponseStatus.BAD,
			};
			return res.status(500).json(response);
		}

		const userId = new mongoose.Types.ObjectId(req.user.id);

		// get projects where the current user is the owner or in the access list
		const foundProjects = await ProjectSchema.find({
			$or: [
				{ accessList: userId },
				{
					owner: userId,
				},
			],
		}).lean();

		// console.log(foundProjects);
		const projectList: Project[] = [];
		for (const foundProject of foundProjects) {
			// const activityList: Activity[] = [];
			// const foundActivities = await ActivitySchema.find({
			// 	projectId: foundProject._id,
			// }).lean();

			// get project note
			const foundProjectNote = await NoteSchema.findOne({
				activityId: foundProject._id,
			}).lean();

			var projectNote: Note | undefined;
			if (!foundProjectNote) {
				console.log("Note not found for project with id = " + foundProject._id.toString());
			} else {
				const note: Note = {
					id: foundProjectNote._id.toString(),
					title: foundProjectNote.title,
					text: foundProjectNote.text,
					tags: foundProjectNote.tags,
					privacy: foundProjectNote.privacy as Privacy,
					accessList: await getUsernameListFromIdList(foundProjectNote.accessList),
					createdAt: foundProjectNote.createdAt,
					updatedAt: foundProjectNote.updatedAt,
					owner: foundProjectNote.owner,
				};

				projectNote = note;
			}

			// populate activity list for project
			/*for (const foundActivity of foundActivities) {
				const foundNote = await NoteSchema.findOne({
					activityId: foundActivity._id,
				}).lean();

				if (!foundNote) {
					console.log("Note not found for activity with id = " + foundActivity._id);
					continue;
				}

				const note: Note = {
					id: foundNote._id.toString(),
					title: foundNote.title,
					text: foundNote.text,
					tags: foundNote.tags,
					privacy: foundNote.privacy as Privacy,
					accessList: await getUserResultFromObjectIdList(foundNote.accessList),
					createdAt: foundNote.createdAt,
					updatedAt: foundNote.updatedAt,
					owner: foundNote.owner,
				};

				const activity: Activity = {
					id: foundActivity._id.toString(),
					title: foundActivity.title,
					description: foundActivity.description,
					deadline: foundActivity.deadline,
					status: await getActivityStatus(),
					owner: foundProject.owner.toString(),
					projectId: foundProject._id.toString(),
					accessList: await getUserResultFromObjectIdList(foundProject.accessList),
					milestone: foundActivity.milestone,
					advancementType:
						foundActivity.advancementType === null
							? undefined
							: (foundActivity.advancementType as AdvancementType),
					note,
					completed: foundActivity.completed,
				};

				activityList.push(activity);
			}*/

			const project: Project = {
				id: foundProject._id.toString(),
				title: foundProject.title,
				description: foundProject.description,
				owner: foundProject.owner,
				accessList: await getUsernameListFromIdList(foundProject.accessList),
				accessListAccepted: foundProject.accessListAccepted ?
					await getUsernameListFromIdList(foundProject.accessListAccepted) : [],
				activityList: await getActivityList(foundProject._id, undefined),
				note: projectNote,
			};

			projectList.push(project);
		}

		const response: ResponseBody = {
			message: "success",
			status: ResponseStatus.GOOD,
			value: projectList,
		};
		return res.status(200).json(response);
	} catch (error) {
		console.log(error);

		const response: ResponseBody = {
			message: "error",
			status: ResponseStatus.BAD,
		};
		return res.status(500).json(response);
	}
});

// returns all projects where the current user is the owner or in the access list
router.get("/:id", async (req: Request, res: Response) => {
	try {
		if (!req.user || !req.user.id) {
			const response: ResponseBody = {
				message: "error",
				status: ResponseStatus.BAD,
			};
			return res.status(500).json(response);
		}
		const userId = new mongoose.Types.ObjectId(req.user.id);

		const projectId = req.params.id as string;

		if (!Types.ObjectId.isValid(projectId)) {
			console.log("Project id is not valid" + projectId);
			const response: ResponseBody = {
				message: "Project id is not valid" + projectId,
				status: ResponseStatus.BAD,
			};
			return res.status(500).json(response);
		}

		const foundProject = await ProjectSchema.findById(projectId).lean();

		if (!foundProject) {
			console.log("Project not found");
			const response: ResponseBody = {
				message: "Project not found",
				status: ResponseStatus.BAD,
			};
			return res.status(500).json(response);
		}

		console.log("Requested project: ", foundProject, userId);

		if (
			!foundProject.accessList.some((id) => id.equals(userId)) &&
			!foundProject.owner.equals(userId)
		) {
			console.log("Requested access for project you cannot access");
			const response: ResponseBody = {
				message: "Requested access for project you cannot access",
				status: ResponseStatus.BAD,
			};
			return res.status(500).json(response);
		}

		console.log(foundProject);

		// get project note
		const foundProjectNote = await NoteSchema.findOne({
			activityId: foundProject._id,
		}).lean();

		var projectNote: Note | undefined;
		if (!foundProjectNote) {
			console.log("Note not found for project with id = " + foundProject._id.toString());
		} else {
			const note: Note = {
				id: foundProjectNote._id.toString(),
				title: foundProjectNote.title,
				text: foundProjectNote.text,
				tags: foundProjectNote.tags,
				privacy: foundProjectNote.privacy as Privacy,
				accessList: await getUsernameListFromIdList(foundProjectNote.accessList),
				createdAt: foundProjectNote.createdAt,
				updatedAt: foundProjectNote.updatedAt,
				owner: foundProjectNote.owner,
			};

			projectNote = note;
		}

		// populate activity list for project
		/* for (const foundActivity of foundActivities) {
			const foundNote = await NoteSchema.findOne({
				activityId: foundActivity._id,
			}).lean();

			var activityNote: Note | undefined = undefined;
			if (!foundNote) {
				console.log("Note not found for activity with id = " + foundActivity._id);
			} else {
				activityNote = {
					id: foundNote._id.toString(),
					title: foundNote.title,
					text: foundNote.text,
					tags: foundNote.tags,
					privacy: foundNote.privacy as Privacy,
					accessList: await getUserResultFromObjectIdList(foundNote.accessList),
					createdAt: foundNote.createdAt,
					updatedAt: foundNote.updatedAt,
					owner: foundNote.owner,
				};
			}

			const activity: Activity = {
				id: foundActivity._id.toString(),
				title: foundActivity.title,
				description: foundActivity.description,
				deadline: foundActivity.deadline,
				status: await getActivityStatus(),
				owner: foundProject.owner.toString(),
				projectId: foundProject._id.toString(),
				accessList: await getUserResultFromObjectIdList(foundProject.accessList),
				milestone: foundActivity.milestone,
				advancementType:
					foundActivity.advancementType === null
						? undefined
						: (foundActivity.advancementType as AdvancementType),
				note: activityNote,
				completed: foundActivity.completed,
			};

			activityList.push(activity);
		}*/

		console.log(projectId);

		const project: Project = {
			id: foundProject._id.toString(),
			title: foundProject.title,
			description: foundProject.description,
			owner: foundProject.owner,
			accessList: await getUsernameListFromIdList(foundProject.accessList),
			activityList: await getActivityList(new Types.ObjectId(projectId), undefined),
			note: projectNote,
		};

		const response: ResponseBody = {
			message: "success",
			status: ResponseStatus.GOOD,
			value: project,
		};
		return res.status(200).json(response);
	} catch (error) {
		console.log(error);

		const response: ResponseBody = {
			message: "error",
			status: ResponseStatus.BAD,
		};
		return res.status(500).json(response);
	}
});

// Get projects where a specific user is owner or in accessListAccepted
router.get("/accepted/:userId", async (req: Request, res: Response) => {
	try {
		const targetUserId = req.params.userId;

		// Verifica che l'ID utente sia valido
		if (!Types.ObjectId.isValid(targetUserId)) {
			return res.status(400).json({
				message: "Invalid user ID format",
				status: ResponseStatus.BAD,
			});
		}

		const userId = new mongoose.Types.ObjectId(targetUserId);

		// Trova i progetti dove l'utente è owner o in accessListAccepted
		const foundProjects = await ProjectSchema.find({
			$or: [
				{ owner: userId },
				{ accessListAccepted: userId }
			],
		}).lean();

		console.log("Found projects:", foundProjects);

		// Costruisci la lista dei progetti con tutte le informazioni necessarie
		const projectList: Project[] = [];
		for (const foundProject of foundProjects) {
			// Ottieni la nota del progetto
			const foundProjectNote = await NoteSchema.findOne({
				activityId: foundProject._id,
			}).lean();

			let projectNote: Note | undefined;
			if (foundProjectNote) {
				projectNote = {
					id: foundProjectNote._id.toString(),
					title: foundProjectNote.title,
					text: foundProjectNote.text,
					tags: foundProjectNote.tags,
					privacy: foundProjectNote.privacy as Privacy,
					accessList: await getUsernameListFromIdList(foundProjectNote.accessList),
					createdAt: foundProjectNote.createdAt,
					updatedAt: foundProjectNote.updatedAt,
					owner: foundProjectNote.owner,
				};
			}

			const project: Project = {
				id: foundProject._id.toString(),
				title: foundProject.title,
				description: foundProject.description,
				owner: foundProject.owner,
				accessList: await getUsernameListFromIdList(foundProject.accessList),
				accessListAccepted: foundProject.accessListAccepted ?
					await getUsernameListFromIdList(foundProject.accessListAccepted) : [],
				activityList: await getActivityList(foundProject._id, undefined),
				note: projectNote,
			};

			projectList.push(project);
		}

		const response: ResponseBody = {
			message: "success",
			status: ResponseStatus.GOOD,
			value: projectList,
		};
		return res.status(200).json(response);

	} catch (error) {
		console.error("Error fetching user projects:", error);
		const response: ResponseBody = {
			message: "Error fetching user projects",
			status: ResponseStatus.BAD,
		};
		return res.status(500).json(response);
	}
});

// insert a new project
router.post("/", async (req: Request, res: Response) => {
	try {
		const title = req.body.title as string | undefined;
		const description = req.body.description as string | undefined;
		const accessList = req.body.accessList as string[] | undefined; // list of usernames

		if (!req.user || !req.user.id) {
			const response: ResponseBody = {
				message: "error",
				status: ResponseStatus.BAD,
			};
			return res.status(500).json(response);
		}

		if (!title || !description || !accessList) {
			const response: ResponseBody = {
				message: "Required: 'title', 'description', 'accessList'",
				status: ResponseStatus.BAD,
			};
			return res.status(500).json(response);
		}

		const newProject = new ProjectSchema({
			title,
			description,
			owner: req.user.id,
			accessList: await getIdListFromUsernameList(accessList),
			accessListAccepted: [],
		});

		const savedProject = await newProject.save();

		const response: ResponseBody = {
			message: "success",
			status: ResponseStatus.GOOD,
			value: savedProject._id.toString(),
		};

		return res.status(200).json(response);
	} catch (error) {
		console.log(error);

		const response: ResponseBody = {
			message: "error",
			status: ResponseStatus.BAD,
		};
		return res.status(500).json(response);
	}
});

// delete a project
router.delete("/:id", async (req: Request, res: Response) => {
	try {
		const id = req.params.id;

		if (!Types.ObjectId.isValid(id)) {
			const resBody: ResponseBody = {
				message: "Invalid project id",
				status: ResponseStatus.BAD,
			};
			console.log("Invalid project id");
			return res.status(400).json(resBody);
		}

		const project = await ProjectSchema.findById(id);
		if (!project) {
			const resBody: ResponseBody = {
				message: "Project not found",
				status: ResponseStatus.BAD,
			};
			console.log("Project not found");
			return res.status(404).json(resBody);
		}

		if (project.owner.toString() !== req.user?.id) {
			const resBody: ResponseBody = {
				message: "You are not the owner of this project",
				status: ResponseStatus.BAD,
			};
			console.log("You are not the owner of this project");
			return res.status(403).json(resBody);
		}

		const deletedProject = await ProjectSchema.findByIdAndDelete(id);

		// Send notification to users
		for (const user of project.accessList) {
			if (user.toString() === req.user.id) continue;

			const notification: Notification = {
				sender: req.user.id,
				receiver: user,
				type: NotificationType.PROJECT,
				sentAt: new Date(Date.now()),
				message: "Il progetto " + project.title + " e' stato eliminato",
				read: false,
				data: {},
			};

			await NotificationSchema.create(notification);
		}

		const response: ResponseBody = {
			message: "success",
			status: ResponseStatus.GOOD,
			value: deletedProject?._id.toString(),
		};

		return res.status(200).json(response);
	} catch (error) {
		console.log(error);
		const response: ResponseBody = {
			message: "error",
			status: ResponseStatus.BAD,
		};
		return res.status(500).json(response);
	}
});

// Ottieni un progetto dal titolo
router.get("/by-title/:title", async (req: Request, res: Response) => {
	try {
		const title = req.params.title;

		if (!title) {
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Titolo del progetto non fornito"
			});
		}

		// Trova il progetto con il titolo specificato
		const foundProject = await ProjectSchema.findOne({ title }).lean();

		if (!foundProject) {
			return res.status(404).json({
				status: ResponseStatus.BAD,
				message: `Progetto con titolo "${title}" non trovato`
			});
		}

		// Verifica che l'utente corrente abbia accesso al progetto
		if (!req.user || !req.user.id) {
			return res.status(401).json({
				status: ResponseStatus.BAD,
				message: "Utente non autenticato"
			});
		}

		const userId = new mongoose.Types.ObjectId(req.user.id);

		// Verifica che l'utente sia il proprietario o nella lista di accesso
		if (!foundProject.accessList.some(id => id.equals(userId)) &&
			!foundProject.owner.equals(userId)) {
			return res.status(403).json({
				status: ResponseStatus.BAD,
				message: "Non hai i permessi per accedere a questo progetto"
			});
		}

		// Costruisci l'oggetto progetto con i dati necessari
		const project: Project = {
			id: foundProject._id.toString(),
			title: foundProject.title,
			description: foundProject.description,
			owner: foundProject.owner,
			accessList: await getUsernameListFromIdList(foundProject.accessList),
			activityList: await getActivityList(foundProject._id, undefined),
			note: undefined // Aggiungi la nota se necessario
		};

		return res.status(200).json({
			status: ResponseStatus.GOOD,
			value: project
		});

	} catch (error) {
		console.error("Errore durante il recupero del progetto:", error);
		return res.status(500).json({
			status: ResponseStatus.BAD,
			message: "Errore durante il recupero del progetto"
		});
	}
});

// update the project
router.put("/:id", async (req: Request, res: Response) => {
	try {
		const id = req.params.id; // project id
		const title = req.body.title;
		const description = req.body.description;
		const accessList = req.body.accessList as string[]; // username list
		const accessListAcceptedUser = req.body.accessListAcceptedUser; // nuovo campo per l'utente da aggiungere


		if (!Types.ObjectId.isValid(id)) {
			const resBody: ResponseBody = {
				message: "Invalid project id",
				status: ResponseStatus.BAD,
			};
			console.log("Invalid project id");
			return res.status(400).json(resBody);
		}

		const project = await ProjectSchema.findById(id);
		if (!project) {
			const resBody: ResponseBody = {
				message: "Project not found",
				status: ResponseStatus.BAD,
			};
			console.log("Project not found");
			return res.status(404).json(resBody);
		}
		/*
				if (project.owner.toString() !== req.user?.id) {
					const resBody: ResponseBody = {
						message: "You are not the owner of this project",
						status: ResponseStatus.BAD,
					};
					console.log("You are not the owner of this project");
					return res.status(403).json(resBody);
				}
					*/

		// Se c'è un utente da aggiungere alla accessListAccepted
		if (accessListAcceptedUser) {
			// Prima ottieni il progetto corrente per avere la lista esistente
			const currentProject = await ProjectSchema.findById(id);
			if (!currentProject) {
				return res.status(404).json({
					message: "Project not found",
					status: ResponseStatus.BAD,
				});
			}

			// Crea una nuova lista che include sia gli utenti esistenti che il nuovo
			const updatedAccessListAccepted = [
				...currentProject.accessListAccepted || [], // mantiene la lista esistente
				new Types.ObjectId(accessListAcceptedUser)  // aggiunge il nuovo utente
			];

			// Aggiorna il progetto con la nuova lista completa
			const updatedProject = await ProjectSchema.findByIdAndUpdate(
				id,
				{
					$set: { // usa $set invece di $addToSet per aggiornare l'intera lista
						accessListAccepted: updatedAccessListAccepted
					}
				},
				{ new: true }
			);

			const response: ResponseBody = {
				message: "success",
				status: ResponseStatus.GOOD,
				value: updatedProject?._id.toString(),
			};

			return res.status(200).json(response);
		}

		var accestIdList: Types.ObjectId[] = [];
		for (let i = 0; i < accessList.length; i++) {
			const foundUser = await UserSchema.findOne({
				username: accessList[i],
			});

			if (!foundUser) {
				const resBody: ResponseBody = {
					message: "User not found: " + accessList[i],
					status: ResponseStatus.BAD,
				};
				console.log("User not found: " + accessList[i]);
				return res.status(400).json(resBody);
			}

			accestIdList.push(foundUser._id);
		}

		const updatedProject = await ProjectSchema.findByIdAndUpdate(
			id,
			{
				title,
				description,
				accessList: accestIdList,
			},
			{ new: true }
		);

		// Send notification to users
		for (const user of project.accessList) {
			if (user.toString() === req.user.id) continue;

			const notification: Notification = {
				sender: req.user.id,
				receiver: user,
				type: NotificationType.PROJECT,
				sentAt: new Date(Date.now()),
				message: "Il progetto " + project.title + " e' stato aggiornato",
				read: false,
				data: {},
			};

			await NotificationSchema.create(notification);
		}

		const response: ResponseBody = {
			message: "success",
			status: ResponseStatus.GOOD,
			value: updatedProject?._id.toString(),
		};

		return res.status(200).json(response);
	} catch (error) {
		console.log(error);
		const response: ResponseBody = {
			message: "error",
			status: ResponseStatus.BAD,
		};
		return res.status(500).json(response);
	}
});

export default router;
