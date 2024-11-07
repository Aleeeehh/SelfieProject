// import UserResult from "./UserResult.js";
import Message from "./Message.js";

type Chat = {
    id?: string;
    name?: string;
    firstUser: string;
    secondUser: string;
    messageList: Message[];
};

export default Chat;
