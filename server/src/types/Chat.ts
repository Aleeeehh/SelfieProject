import { Types } from "mongoose";
import Message from "./Message.ts";

type Chat = {
    id?: string | Types.ObjectId;
    name?: string;
    firstUser: string;
    secondUser: string;
    messageList: Message[];
};

export default Chat;
