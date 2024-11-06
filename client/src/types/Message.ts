type Message = {
    id?: string;
    username: string;
    text: string;
    chatId: string;
    createdAt?: Date;
};

export default Message;
