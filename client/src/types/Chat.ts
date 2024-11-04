import { Types } from "mongoose";
import UserResult from "./UserResult.ts";
import Message from "./Message.ts";

type Chat = {
    id?: string | Types.ObjectId;
    name?: string;
    userList: UserResult[];
    messageList: Message[];
};

export default Chat;
