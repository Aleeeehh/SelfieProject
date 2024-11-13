import type Note from "./Note.js";
// import type UserResult from "./UserResult.ts";

type Activity = {
	id?: string;
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
	projectId?: string;
	start?: Date;
	milestone?: boolean;
	advancementType?: AdvancementType;
	note?: Note; // Nota descrittiva del progetto
	parent?: string;
	prev?: string;
	next?: string;
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
