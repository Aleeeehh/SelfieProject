import { Types } from "mongoose";
import Message from "./Message.js";

type Chat = {
	id?: string | Types.ObjectId;
	name?: string;
	firstUser: string;
	secondUser: string;
	messageList: Message[];
};

export default Chat;
