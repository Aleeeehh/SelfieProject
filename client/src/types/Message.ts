type Message = {
	id?: string;
	userId: string;
	text: string;
	chatId: string;
	createdAt?: Date;
};

export default Message;
