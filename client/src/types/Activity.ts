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
	status?: ActivityStatus | null;
	projectId?: string | null;
	start?: Date | null;
	milestone?: boolean | null;
	advancementType?: AdvancementType | null;
	note?: Note | null; // Nota descrittiva del progetto
	parent?: string | null;
	prev?: string | null;
	next?: string | null;
	children?: Activity[] | null;
	active?: boolean | null;
	abandoned?: boolean | null;
	reactivated?: boolean | null;
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
