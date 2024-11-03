import { Types } from "mongoose";

type Message = {
    id?: Types.ObjectId | string;
    userId: Types.ObjectId | string;
    text: string;
    chatId: Types.ObjectId | string;
    createdAt?: Date;
};

export default Message;
