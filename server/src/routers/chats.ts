import { Request, Response, Router } from "express";
import { ResponseBody } from "../types/ResponseBody.js";
import { ResponseStatus } from "../types/ResponseStatus.js";
import UserSchema from "../schemas/User.js";
import { Types } from "mongoose";
import { MessageSchema, ChatSchema } from "../schemas/Chat.js";
import UserResult from "../types/UserResult.js";
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

		const foundChats = await ChatSchema.find().lean();

		console.log(foundChats);

		const chats = [];
		const users = new Map<string, string>(); // id -> username

		for (const foundChat of foundChats) {
			// For each chat populate userList
			const userList = [] as UserResult[];
			for (const user of foundChat.userList) {
				const foundUser = await UserSchema.findById(user).lean();
				if (!foundUser) {
					console.log("User not found: " + user);
					continue;
				}

				userList.push({
					id: user.toString(),
					username: foundUser.username,
				});
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

				const userResult: UserResult = {
					id: userId,
					username: users.get(userId)!,
				};

				const messageObj: Message = {
					id: message._id.toString(),
					chatId: foundChat._id.toString(),
					userId: userResult.id,
					text: message.text,
					createdAt: message.createdAt,
				};

				if (!userList.find((u) => u.id === userId)) userList.push(userResult);

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

		console.log(chats);

		const sortedChats = chats.sort((a, b) => {
			{
				if (!a.messageList[0] || a.messageList[0].createdAt === undefined) return 1;
				if (!b.messageList[0] || b.messageList[0].createdAt === undefined) return -1;
				return a.messageList[0].createdAt.getTime() - b.messageList[0].createdAt.getTime();
			}
		});

		return res.status(200).json({ status: ResponseStatus.GOOD, value: sortedChats });
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

		const type = req.body.type as string | undefined;
		const userList = req.body.userList as string[] | undefined;
		const name = req.body.name as string | undefined;

		if (!userList) {
			console.log("Invalid body: 'userList' required");
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid body: 'userList' required",
			});
		}

		if (type && ["group", "private"].indexOf(type) === -1) {
			console.log("Invalid body: 'type' should be 'group' or 'private'");
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid body: 'type' should be 'group' or 'private'",
			});
		}

		if (type === "group" && !name) {
			console.log("Invalid body: 'name' required for 'group' type");
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "Invalid body: 'name' required for 'group' type",
			});
		}

		const users = [] as UserResult[];
		for (const id of userList) {
			if (!Types.ObjectId.isValid(id)) {
				console.log("Invalid user id: " + id);
				return res.status(400).json({
					status: ResponseStatus.BAD,
					message: "Invalid user id: " + id,
				});
			}

			const user = await UserSchema.findById(id);
			if (!user) {
				console.log("Invalid user id: " + id);
				return res.status(400).json({
					status: ResponseStatus.BAD,
					message: "Invalid user id: " + id,
				});
			}

			users.push({
				id: user._id.toString(),
				username: user.username,
			});
		}

		// Add logged user to list
		const currentUser = await UserSchema.findById(req.user.id);
		if (!currentUser)
			return res.status(400).json({
				status: ResponseStatus.BAD,
				message: "This should not happen",
			});

		if (!users.find((u) => u.id === currentUser._id.toString()))
			users.push({
				id: currentUser._id.toString(),
				username: currentUser.username,
			});

		const chat: Chat = {
			id: undefined,
			name: name || undefined,
			userList: users,
			messageList: [],
		};

		const createdChat = await ChatSchema.create({
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

router.post("/messages", async (req: Request, res: Response) => {
	try {
		// TODO: validate input
		const text = req.body.text as string | undefined;
		const chatId = req.body.chatId as string | undefined;

		if (!text || !chatId) {
			const resBody: ResponseBody = {
				message: "Invalid body: 'text' and 'chatId' required",
				status: ResponseStatus.BAD,
			};

			console.log("Invalid body: 'text' and 'chatId' required");
			return res.status(400).json(resBody);
		}

		const newMessage: Message = {
			userId: req.user!.id!,
			text,
			chatId: req.body.chatId,
		};

		const createdMessage = await MessageSchema.create(newMessage);

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

		const deletedMessage = await MessageSchema.deleteMany({ chatId: id }).lean();

		const resBody: ResponseBody = {
			message: "Chat deleted",
			status: ResponseStatus.GOOD,
			value: { chat: deletedChat.id.toString(), messageCount: deletedMessage.deletedCount },
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
