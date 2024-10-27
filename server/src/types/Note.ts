import type { Types } from "mongoose";
import { Privacy } from "./Privacy.js";
import UserResult from "./UserResult.js";

type Note = {
    id?: Types.ObjectId | string;
    owner: Types.ObjectId | string;
    title: String;
    text: String;
    tags: String[];
    privacy: Privacy;
    accessList: UserResult[];
    createdAt?: Date;
    updatedAt?: Date;
};

export default Note;
