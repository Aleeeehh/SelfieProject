import type { Privacy } from "../schemas/Note.js";
import type { Types } from "mongoose";

type Note = {
	id?: Types.ObjectId | string;
	owner: Types.ObjectId | string;
	title: String;
	text: String;
	tags: String[];
	privacy: Privacy;
	accessList: Types.ObjectId[] | string[];
	createdAt?: Date;
	updatedAt?: Date;
};

export default Note;
