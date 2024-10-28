import { Request, Response, Router } from "express";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import UserSchema from "../schemas/User.js";
import { Types } from "mongoose";
import { MessageSchema, UserChatSchema } from "../schemas/Chat.js";
import UserResult from "../types/UserResult.js";

const router: Router = Router();

type Chat = {
    id?: string | Types.ObjectId;
    name?: string;
    userList: UserResult[];
    messageList: Message[];
};

type Message = {
    user: UserResult;
    text: string;
    timestamp: Date;
};

// Returns all chats for the user
router.get("/", async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                status: ResponseStatus.BAD,
                message: "User not authenticated",
            });
        }

        // TODO: filter per logged user
        const foundChats = await UserChatSchema.find({
            userId: req.user.id,
        }).lean();
        const chats = [];
        const users = new Map<string, UserResult>();

        // For each chat, find the messages
        for (const foundChat of foundChats) {
            const foundMessages = await MessageSchema.find({
                chatId: foundChat._id,
            }).lean();

            const messages: Message[] = [];
            const userList = [] as UserResult[];

            for (const message of foundMessages) {
                // User not in map: add it
                const userId = message.userId.toString();
                if (!users.has(userId)) {
                    const foundUser = await UserSchema.findById(
                        message.userId
                    ).lean();
                    if (!foundUser) {
                        continue;
                    }
                    users.set(foundUser._id.toString(), {
                        id: foundUser._id.toString(),
                        username: foundUser.username,
                    });
                }

                const messageObj: Message = {
                    user: users.get(userId)!,
                    text: message.text,
                    timestamp: message.createdAt,
                };

                if (!userList.find((u) => u.id === users.get(userId)?.id))
                    userList.push(users.get(userId)!);

                messages.push(messageObj);
            }

            const chat: Chat = {
                id: foundChat._id.toString(),
                name: foundChat.name || null || undefined,
                messageList: messages,
                userList: userList,
            };

            chats.push(chat);
        }

        const sortedChats = chats.sort((a, b) => {
            return (
                a.messageList[0].timestamp.getTime() -
                b.messageList[0].timestamp.getTime()
            );
        });

        return res
            .status(200)
            .json({ status: ResponseStatus.GOOD, value: sortedChats });
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

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                status: ResponseStatus.BAD,
                message: "User not authenticated",
            });
        }

        const type = req.body.title as string | undefined;
        const userList = req.body.description as string[] | undefined;
        const name = req.body.name as string | undefined;

        if (!type || !userList)
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Invalid body: 'type' and 'userList' required",
            });

        if (["group", "private"].indexOf(type) === -1)
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Invalid body: 'type' should be 'group' or 'private'",
            });

        if (type === "group" && !name)
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Invalid body: 'name' required for 'group' type",
            });

        const users = [] as UserResult[];
        for (const id of userList) {
            if (!Types.ObjectId.isValid(id))
                return res.status(400).json({
                    status: ResponseStatus.BAD,
                    message: "Invalid user id: " + id,
                });

            const user = await UserSchema.findById(id);
            if (!user)
                return res.status(400).json({
                    status: ResponseStatus.BAD,
                    message: "Invalid user id: " + id,
                });

            users.push({
                id: user._id.toString(),
                username: user.username,
            });
        }

        const chat: Chat = {
            id: undefined,
            name: name || undefined,
            userList: users,
            messageList: [],
        };

        const createdChat = await UserChatSchema.create({
            userId: chat.id,
            name: chat.name,
            userList: users.map((u) => u.id),
        });

        console.log("Chat creata:", createdChat);

        const resBody: ResponseBody = {
            message: "Chat created",
            status: ResponseStatus.GOOD,
            value: createdChat._id.toString(),
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

router.post("/message", async (_: Request, res: Response) => {
    try {
        // TODO
        throw new Error("Not implemented yet");
        // return res.status(200).json(resBody);
    } catch (e) {
        console.log(e);
        const resBody: ResponseBody = {
            message: "Error handling request",
            status: ResponseStatus.BAD,
        };

        return res.status(500).json(resBody);
    }
});

router.delete("/:id", async (_: Request, res: Response) => {
    try {
        // TODO
        throw new Error("Not implemented yet");
        // return res.status(200).json(resBody);
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
