import type { Types } from "mongoose";
import type Note from "./Note.ts";
import type UserResult from "./UserResult.ts";

type Activity = {
	id?: Types.ObjectId | String;
	title: String;
	description: String;
	deadline: Date; // è l'end date per i progetti
	completed: boolean; // non serve: è completed if status == COMPLETED
	completedAt?: Date;
	owner: String;
	//tags: String[];
	createdAt?: Date;
	updatedAt?: Date;
	accessList: UserResult[]; // sono gli attori per i progetti

	// parameters added for project management
	status?: ActivityStatus;
	projectId?: Types.ObjectId | String;
	start?: Date;
	milestone?: boolean;
	advancementType?: AdvancementType;
	note?: Note; // Nota descrittiva del progetto
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
