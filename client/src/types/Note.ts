import { Privacy } from "./Privacy";
import UserResult from "./UserResult";

export enum NoteType {
	NOTE = "note",
	LIST = "list",
}

export type ListItem = {
    id?: string;
	endDate?: Date;
	completed: boolean;
	name: string;
};

type Note = {
	id?: string;
	owner: string;
	title: string;
	text: string;
	tags: string[];
	privacy: Privacy;
	accessList: UserResult[];
	createdAt?: Date;
	updatedAt?: Date;
	type: NoteType;
	list: ListItem[];
};

export default Note;
