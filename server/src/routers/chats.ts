import { Request, Response, Router } from "express";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import UserSchema from "../schemas/User.js";
import { Types } from "mongoose";
import { MessageSchema, ChatSchema } from "../schemas/Chat.js";
// import UserResult from "../types/UserResult.js";
import type Message from "../types/Message.ts";
import type Chat from "../types/Chat.ts";

const router: Router = Router();

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
        // const userId = req.user.id;

        const foundChats = await ChatSchema.find({
            $or: [{ firstUserId: req.user.id }, { secondUserId: req.user.id }],
        }).lean();

        console.log(foundChats);

        const chats: Chat[] = [];
        const users = new Map<string, string>(); // id -> username

        for (const foundChat of foundChats) {
            // For each chat populate userList

            const firstUser = await UserSchema.findById(
                foundChat.firstUserId
            ).lean();
            if (!firstUser) {
                console.log("User not found: " + foundChat.firstUserId);
                continue;
            }

            const secondUser = await UserSchema.findById(
                foundChat.secondUserId
            ).lean();
            if (!secondUser) {
                console.log("User not found: " + foundChat.secondUserId);
                continue;
            }

            // For each chat populate messageList
            const foundMessages = await MessageSchema.find({
                chatId: foundChat._id,
            }).lean();

            const messages = [] as Message[];
            for (const message of foundMessages) {
                // User not in map: add it
                const userId = message.userId.toString();
                if (!users.has(userId)) {
                    const foundUser = await UserSchema.findById(userId).lean();

                    if (!foundUser) {
                        console.log("User not found: " + userId);
                        continue;
                    }

                    users.set(foundUser._id.toString(), foundUser.username);
                }

                const messageObj: Message = {
                    id: message._id.toString(),
                    chatId: foundChat._id.toString(),
                    username: users.get(message.userId.toString())!,
                    text: message.text,
                    createdAt: message.createdAt,
                };

                messages.push(messageObj);
            }
            const chat: Chat = {
                id: foundChat._id.toString(),
                name: foundChat.name || null || undefined,
                messageList: messages,
                firstUser: firstUser.username,
                secondUser: secondUser.username,
            };

            chats.push(chat);
        }

        console.log(chats);

        const sortedChats = chats.sort((a, b) => {
            {
                if (
                    !a.messageList[0] ||
                    a.messageList[0].createdAt === undefined
                )
                    return 1;
                if (
                    !b.messageList[0] ||
                    b.messageList[0].createdAt === undefined
                )
                    return -1;
                return (
                    a.messageList[0].createdAt.getTime() -
                    b.messageList[0].createdAt.getTime()
                );
            }
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

        console.log(req.body);

        // const type = req.body.type as string | undefined;
        const firstUser = req.body.firstUser as string | undefined; // username
        const secondUser = req.body.secondUser as string | undefined; // username
        const name = req.body.name as string | undefined;

        if (!firstUser || !secondUser) {
            console.log("Invalid body: 'firstUser' and 'secondUser' required");
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Invalid body: 'firstUser' and 'secondUser' required",
            });
        }

        // if (type && ["group", "private"].indexOf(type) === -1) {
        //     console.log("Invalid body: 'type' should be 'group' or 'private'");
        //     return res.status(400).json({
        //         status: ResponseStatus.BAD,
        //         message: "Invalid body: 'type' should be 'group' or 'private'",
        //     });
        // }

        // if (type === "group" && !name) {
        //     console.log("Invalid body: 'name' required for 'group' type");
        //     return res.status(400).json({
        //         status: ResponseStatus.BAD,
        //         message: "Invalid body: 'name' required for 'group' type",
        //     });
        // }

        // const users = [] as string[];
        // for (const id of userList) {
        //     if (!Types.ObjectId.isValid(id)) {
        //         console.log("Invalid user id: " + id);
        //         return res.status(400).json({
        //             status: ResponseStatus.BAD,
        //             message: "Invalid user id: " + id,
        //         });
        //     }
        //     const user = await UserSchema.findById(id);
        //     if (!user) {
        //         console.log("Invalid user id: " + id);
        //         return res.status(400).json({
        //             status: ResponseStatus.BAD,
        //             message: "Invalid user id: " + id,
        //         });
        //     }
        //     users.push(user.username);
        // }

        // validate users pair
        const currentUser = await UserSchema.findById(req.user.id);
        if (!currentUser)
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "This should not happen",
            });

        if (
            firstUser !== currentUser.username &&
            secondUser !== currentUser.username
        ) {
            console.log("Cannot create chat for another user pair");
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Cannot create chat for another user pair",
            });
        }

        const firstUserObj = await UserSchema.findOne({ username: firstUser });
        if (!firstUserObj) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "User not found",
            });
        }

        const secondUserObj = await UserSchema.findOne({
            username: secondUser,
        });
        if (!secondUserObj) {
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "User not found",
            });
        }

        if (firstUser === secondUser) {
            console.log("Cannot create chat for same user");
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Cannot create chat for same user",
            });
        }

        // check if chat already exists
        const foundChat = await ChatSchema.findOne({
            $or: [
                {
                    firstUserId: firstUserObj._id,
                    secondUserId: secondUserObj._id,
                },
                {
                    firstUserId: secondUserObj._id,
                    secondUserId: firstUserObj._id,
                },
            ],
        }).lean();

        if (foundChat) {
            console.log("Chat already exists");
            return res.status(400).json({
                status: ResponseStatus.BAD,
                message: "Chat already exists",
            });
        }

        const createdChat = await ChatSchema.create({
            name: name || undefined,
            firstUserId: firstUserObj._id,
            secondUserId: secondUserObj._id,
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

router.post("/:chatId/messages", async (req: Request, res: Response) => {
    try {
        // TODO: validate input
        const text = req.body.text as string | undefined;
        const chatId = req.params.chatId as string;

        if (!req.user || !req.user.id) {
            console.log("User not authenticated");
            return res.status(401).json({
                status: ResponseStatus.BAD,
                message: "User not authenticated",
            });
        }

        if (!Types.ObjectId.isValid(chatId)) {
            const resBody: ResponseBody = {
                message: "Invalid id",
                status: ResponseStatus.BAD,
            };
            console.log("Invalid id");
            return res.status(400).json(resBody);
        }

        if (!text) {
            const resBody: ResponseBody = {
                message: "Invalid body: 'text' required",
                status: ResponseStatus.BAD,
            };

            console.log("Invalid body: 'text' and 'chatId' required");
            return res.status(400).json(resBody);
        }

        const newMessage: Message = {
            username: "",
            text,
            chatId,
        };

        const createdMessage = await MessageSchema.create({
            text: newMessage.text,
            userId: req.user.id,
            chatId: newMessage.chatId,
        });

        const resBody: ResponseBody = {
            message: "Message created",
            status: ResponseStatus.GOOD,
            value: createdMessage._id.toString(),
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
    try {
        const id = req.params.id;

        if (!Types.ObjectId.isValid(id)) {
            const resBody: ResponseBody = {
                message: "Invalid id",
                status: ResponseStatus.BAD,
            };
            console.log("Invalid id");
            return res.status(400).json(resBody);
        }

        const deletedChat = await ChatSchema.findByIdAndDelete(id);

        if (!deletedChat) {
            const resBody: ResponseBody = {
                message: "Chat not found",
                status: ResponseStatus.BAD,
            };
            console.log("Chat not found");
            return res.status(404).json(resBody);
        }

        const deletedMessage = await MessageSchema.deleteMany({
            chatId: id,
        }).lean();

        const resBody: ResponseBody = {
            message: "Chat deleted",
            status: ResponseStatus.GOOD,
            value: {
                chat: deletedChat.id.toString(),
                messageCount: deletedMessage.deletedCount,
            },
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
