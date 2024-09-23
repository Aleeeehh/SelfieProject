type Note = {
	id: string;
	ownerId: string;
	title: String;
	text: String;
	tags: String[];
	createdAt: Date;
	updatedAt: Date;
};

export default Note;
