type Note = {
	id: string;
	owner: string;
	title: string;
	text: string;
	tags: string[];
	createdAt?: Date;
	updatedAt?: Date;
};

export default Note;
