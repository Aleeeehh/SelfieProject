import { Request, Response, Router } from "express";
import type { ResponseBody } from "../types/ResponseBody.ts";
import { ResponseStatus } from "../types/ResponseStatus.ts";
import { ProjectSchema } from "../schemas/Project.ts";
import type Project from "../types/Project.ts";
import { ActivitySchema } from "../schemas/Activity.ts";
import type Activity from "../types/Activity.ts";
import { ActivityStatus } from "../types/Activity.ts";
import NoteSchema from "../schemas/Note.ts";
import type Note from "../types/Note.ts";
import type UserResult from "../types/UserResult.ts";
import UserSchema from "../schemas/User.ts";
import { Types } from "mongoose";
import type { Privacy } from "../types/Privacy.ts";

const router: Router = Router();

async function getUserResultFromIdList(
    idList: string[]
): Promise<UserResult[]> {
    const userResultList: UserResult[] = [];
    for (const userId of idList) {
        const foundUser = await UserSchema.findById(userId).lean();
        if (!foundUser) {
            console.log("User not found: " + userId);
            continue;
        }
        userResultList.push({
            id: foundUser._id.toString(),
            username: foundUser.username,
        });
    }
    return userResultList;
}

async function getUserResultFromObjectIdList(
    idList: Types.ObjectId[]
): Promise<UserResult[]> {
    return await getUserResultFromIdList(idList.map((id) => id.toString()));
}
async function getActivityStatus(): Promise<ActivityStatus> {
    // TODO: implement function
    console.log("getActivityStatus() not implemented yet");
    return ActivityStatus.ACTIVE;
}

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

        const foundProjects = await ProjectSchema.find({
            $or: [
                { owner: req.user.id },
                { accessList: { $in: [req.user.id] } },
            ],
        }).lean();

        const projectList: Project[] = [];
        for (const foundProject of foundProjects) {
            const activityList: Activity[] = [];
            const foundActivities = await ActivitySchema.find({
                projectId: foundProject._id,
            }).lean();

            // get project note
            const foundProjectNote = await NoteSchema.findOne({
                activityId: foundProject._id,
            }).lean();

            if (!foundProjectNote) {
                console.log(
                    "Note not found for project with id = " +
                        foundProject._id.toString()
                );
                continue;
            }

            const note: Note = {
                id: foundProjectNote._id.toString(),
                title: foundProjectNote.title,
                text: foundProjectNote.text,
                tags: foundProjectNote.tags,
                privacy: foundProjectNote.privacy as Privacy,
                accessList: await getUserResultFromObjectIdList(
                    foundProjectNote.accessList
                ),
                createdAt: foundProjectNote.createdAt,
                updatedAt: foundProjectNote.updatedAt,
                owner: foundProjectNote.owner,
            };

            // populate activity list for project
            for (const foundActivity of foundActivities) {
                const foundNote = await NoteSchema.findOne({
                    activityId: foundActivity._id,
                }).lean();

                if (!foundNote) {
                    console.log(
                        "Note not found for activity with id = " +
                            foundActivity._id
                    );
                    continue;
                }

                const note: Note = {
                    id: foundNote._id.toString(),
                    title: foundNote.title,
                    text: foundNote.text,
                    tags: foundNote.tags,
                    privacy: foundNote.privacy as Privacy,
                    accessList: await getUserResultFromObjectIdList(
                        foundNote.accessList
                    ),
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
                    accessList: await getUserResultFromObjectIdList(
                        foundProject.accessList
                    ),
                    milestone: foundActivity.milestone,
                    advancementType:
                        foundActivity.advancementType === null
                            ? undefined
                            : foundActivity.advancementType,
                    note,
                    completed: foundActivity.completed,
                };

                activityList.push(activity);
            }

            const project: Project = {
                id: foundProject._id.toString(),
                title: foundProject.title,
                description: foundProject.description,
                owner: foundProject.owner,
                accessList: await getUserResultFromObjectIdList(
                    foundProject.accessList
                ),
                activityList,
                note,
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

// insert a new project
router.post("/", async (req: Request, res: Response) => {
    try {
        const title = req.body.title;
        const description = req.body.description;
        const accessList = req.body.accessList as string[];

        if (!req.user || !req.user.id) {
            const response: ResponseBody = {
                message: "error",
                status: ResponseStatus.BAD,
            };
            return res.status(500).json(response);
        }

        const newProject = new ProjectSchema({
            title,
            description,
            owner: req.user.id,
            accessList,
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

// update the project
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const title = req.body.title;
        const description = req.body.description;
        const accessList = req.body.accessList as string[];

        if (!Types.ObjectId.isValid(id)) {
            const resBody: ResponseBody = {
                message: "Invalid project id",
                status: ResponseStatus.BAD,
            };
            console.log("Invalid project id");
            return res.status(400).json(resBody);
        }

        for (let i = 0; i < accessList.length; i++) {
            if (!Types.ObjectId.isValid(accessList[i])) {
                const resBody: ResponseBody = {
                    message: "Invalid user id: " + accessList[i],
                    status: ResponseStatus.BAD,
                };
                console.log("Invalid user id: " + accessList[i]);
                return res.status(400).json(resBody);
            }
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

        const updatedProject = await ProjectSchema.findByIdAndUpdate(
            id,
            {
                title,
                description,
                accessList,
            },
            { new: true }
        );

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
