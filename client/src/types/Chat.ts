import UserResult from "./UserResult.js";
import Message from "./Message.js";

type Chat = {
	id?: string;
	name?: string;
	userList: UserResult[];
	messageList: Message[];
};

export default Chat;
