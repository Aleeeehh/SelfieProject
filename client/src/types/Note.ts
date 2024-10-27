import { Privacy } from "./Privacy";
import UserResult from "./UserResult";

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
};

export default Note;
