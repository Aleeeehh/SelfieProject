type Note = {
	id: string;
	owner: string;
	title: String;
	text: String;
	tags: String[];
	createdAt?: Date;
	updatedAt?: Date;
};

export default Note;
