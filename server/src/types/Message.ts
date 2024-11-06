import { Types } from "mongoose";

type Message = {
    id?: Types.ObjectId | string;
    username: string;
    text: string;
    chatId: Types.ObjectId | string;
    createdAt?: Date;
};

export default Message;
