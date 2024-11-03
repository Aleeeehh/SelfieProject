import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
        },
    },
    { timestamps: true }
);

export const MessageSchema = mongoose.model("Message", messageSchema);

const chatschema = new mongoose.Schema(
    {
        userList: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "User",
            required: true,
        },
        name: {
            type: String,
        },
    },
    { timestamps: true }
);

export const ChatSchema = mongoose.model("Chat", chatschema);
