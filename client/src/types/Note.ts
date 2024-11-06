import { Privacy } from "./Privacy";
// import UserResult from "./UserResult";

export type ListItem = {
    id?: string;
    endDate?: Date;
    completed: boolean;
    text: string;
};

type Note = {
    id?: string;
    owner: string;
    title: string;
    text: string;
    tags: string[];
    privacy: Privacy;
    accessList: string[]; // username
    createdAt?: Date;
    updatedAt?: Date;
    toDoList: ListItem[];
};

export default Note;
