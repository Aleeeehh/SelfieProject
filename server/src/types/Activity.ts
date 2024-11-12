import type { Types } from "mongoose";
import type Note from "./Note.ts";
// import type UserResult from "./UserResult.ts";

type Activity = {
	id?: Types.ObjectId | string;
	title: string;
	description: string;
	deadline: Date; // è l'end date per i progetti
	completed: boolean; // non serve: è completed if status == COMPLETED
	completedAt?: Date;
	owner: string;
	idEventoNotificaCondiviso?: string;
	//tags: string[];
	createdAt?: Date;
	updatedAt?: Date;
	accessList: string[]; // sono gli attori per i progetti, username list

	// parameters added for project management
	status?: ActivityStatus;
	projectId?: Types.ObjectId | string;
	start?: Date;
	milestone?: boolean;
	advancementType?: AdvancementType;
	note?: Note; // Nota descrittiva del progetto
	parent?: Types.ObjectId | string;
	prev?: Types.ObjectId | string;
	next?: Types.ObjectId | string;
	children?: Activity[];
};

export default Activity;

export enum ActivityStatus {
	NOT_ACTIVABLE = "Non Attivabile",
	ACTIVABLE = "Attivabile",
	ACTIVE = "Attiva",
	COMPLETED = "Conclusa",
	REACTIVATED = "Riattivata",
	LATE = "In Ritardo",
	ABANDONED = "Abbandonata",
}

export enum AdvancementType {
	TRANSLATION = "Traslazione",
	CONTRACTION = "Contrazione",
}
