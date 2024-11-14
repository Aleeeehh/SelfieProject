import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Note, { type ListItem } from "./types/Note";
import { useNavigate, useParams } from "react-router-dom";
// import { marked } from "marked";
// import UserResult from "./types/UserResult";
import { Privacy } from "./types/Privacy";
import SearchForm from "./SearchForm";
import type Project from "./types/Project";
import type Activity from "./types/Activity";
import ActivityForm from "./ActivityForm";

const baseNote: Note = {
	id: "",
	title: "",
	text: "",
	owner: "",
	tags: [] as string[],
	privacy: Privacy.PRIVATE,
	accessList: [] as string[],
	toDoList: [] as ListItem[],
};

const baseActivity: Activity = {
	id: "",
	title: "",
	description: "",
	deadline: new Date(),
	owner: "",
	accessList: [] as string[],
	completed: false,
	start: new Date(),
};

const baseProject: Project = {
	id: "",
	title: "",
	description: "",
	owner: "",
	accessList: [] as string[],
	activityList: [] as Activity[],
	note: baseNote,
};

//TODO: aggiungere un bottone per uscire dalla creazione di una nota

const NEW = "new";

export default function ProjectPage(): React.JSX.Element {
	const { id } = useParams();
	const [project, setProject] = React.useState(baseProject);
	const [message, setMessage] = React.useState("");
	const [isEditing, setIsEditing] = React.useState(id === NEW);
	const [activityFormOpen, setActivityFormOpen] = React.useState(false);
	const [currentActivity, setCurrentActivity] = React.useState<Activity | undefined>(
		baseActivity
	);

	const nav = useNavigate();

	async function updateProject(): Promise<void> {
		if (id !== NEW)
			fetch(`${SERVER_API}/projects/${id}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.status === ResponseStatus.GOOD) {
						setProject(data.value as Project);
						setIsEditing(id === NEW);
						setActivityFormOpen(false);
						console.log(data.value);
					} else {
						console.log(data.message || "Errore nel caricamento del progetto");
						// nav("/projects");
					}
				})
				.catch(() => {
					setMessage("Impossibile raggiungere il server");
					// nav("/projects");
				});
	}

	/* function getSiblings(activity: Activity): { title: string; id: string | undefined }[] {
		
        // return the list of children, given the id of the parent
        if (!activity.parent) {
            // if parent is null, return the list of 1st level project activities
            return project.activityList.filter((a) => a.id !== activity.id).map((a)=> ({title: a.title, id: a.id}));
        } else {
            // if parent is not null, find the parent activity and return its children
            
            
        }
	}*/

	function getListOfActivities(): { title: string; id: string | undefined }[] {
		const list: { title: string; id: string | undefined }[] = [];
		for (let i = 0; i < project.activityList.length; i++) {
			list.concat(getListOfChildrenActivities(project.activityList[i]));
			list.push({ title: project.activityList[i].title, id: project.activityList[i].id });
		}
		return list;
	}

	function getListOfChildrenActivities(
		activity: Activity
	): { title: string; id: string | undefined }[] {
		if (!activity.children) return [];

		const list: { title: string; id: string | undefined }[] = [];
		for (let i = 0; i < activity.children.length; i++) {
			list.concat(getListOfChildrenActivities(activity.children[i]));
		}

		return list;
	}
	// On page load, get the project data
	React.useEffect(() => {
		updateProject();
	}, []);

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setProject({ ...project, [e.target.name]: e.target.value });
	}

	async function handleCreateProject(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		try {
			const res = await fetch(`${SERVER_API}/projects`, {
				method: "POST",
				body: JSON.stringify({
					title: project.title,
					description: project.description,
					accessList: project.accessList,
				}),
				headers: { "Content-Type": "application/json" },
			});

			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				const newNoteId: string = resBody.value;
				alert("Progetto creato correttamente!");

				// redirect to update page of the created note
				nav(`/projects/${newNoteId}`);
			} else {
				setMessage(resBody.message || "Errore nel caricamento del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	async function handleUpdateProject(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// TODO: validate inputs (not empty, max length)
		try {
			const res = await fetch(`${SERVER_API}/projects/${id}`, {
				method: "PUT",
				body: JSON.stringify(project),
				headers: { "Content-Type": "application/json" },
			});

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				alert("Progetto aggiornato correttamente!");

				await updateProject();

				console.log(resBody.value as Note);
			} else {
				setMessage(resBody.message || "Errore nell'aggiornamento del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	async function handleDeleteProject(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// TODO: validate inputs (not empty, max length)
		try {
			const res = await fetch(`${SERVER_API}/projects/${id}`, {
				method: "DELETE",
			});

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				alert("Progetto cancellato correttamente!");
				nav("/projects");
			} else {
				setMessage(resBody.message || "Errore della cancellazione del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	async function handleDeleteActivity(
		e: React.MouseEvent<HTMLButtonElement>,
		id: string | undefined
	): Promise<void> {
		e.preventDefault();

		if (!id) {
			console.log("Id non trovato per l'attività, impossibile eliminare");
			setMessage("Id non trovato per l'attività, impossibile eliminare");
			return;
		}

		try {
			const res = await fetch(`${SERVER_API}/activity/${id}`, {
				method: "DELETE",
			});

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				alert("Attività cancellata correttamente!");

				await updateProject();
			} else {
				setMessage(resBody.message || "Errore della cancellazione del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	function toggleEdit(e: React.MouseEvent<HTMLButtonElement>): void {
		if (isEditing) {
			handleUpdateProject(e);
		}

		setIsEditing(!isEditing);
	}

	function toggleEditActivity(
		e: React.MouseEvent<HTMLButtonElement>,
		id: string | undefined
	): void {
		e.preventDefault();

		if (!id) {
			console.log("Id non trovato per l'attività, impossibile eliminare");
			setMessage("Id non trovato per l'attività, impossibile eliminare");
			return;
		}

		setCurrentActivity(project.activityList.find((act) => act.id === id)!);
		setActivityFormOpen(true);
	}

	function handleCreateActivityOpen(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setCurrentActivity(undefined);
		setActivityFormOpen(true);
	}

	function addUser(e: React.ChangeEvent<HTMLSelectElement>, user: string): void {
		e.preventDefault();

		if (!project.accessList.includes(user))
			// TODO: optimize
			setProject((prevProj) => {
				return {
					...prevProj,
					accessList: [...prevProj.accessList, user],
				};
			});
	}

	function deleteUser(e: React.MouseEvent<HTMLElement>, username: string): void {
		e.preventDefault();

		setProject((prevProj) => {
			return {
				...prevProj,
				accessList: prevProj.accessList.filter((u) => u !== username),
			};
		});
	}

	return (
		<>
			<div className="project-background">
				<div className="project-container">
					<div className="project-page-title">
						{id === NEW ? "Crea un nuovo progetto" : "Modifica progetto"}
						<a href="/projects" className="close-link">
							X
						</a>
					</div>
					{/* render title */}
					{isEditing ? (
						<label htmlFor="title">
							Titolo
							<input name="title" value={project.title} onChange={handleChange} />
						</label>
					) : (
						<div className="project-title">{project.title}</div>
					)}
					{/* render description */}
					{isEditing ? (
						<label htmlFor="description">
							Descrizione
							<textarea
								name="description"
								value={project.description}
								onChange={handleChange}
								maxLength={1500}
							/>
						</label>
					) : (
						<div className="note-description">{project.description}</div>
					)}
					{/* render access list */}
					<label>
						Utenti partecipanti al progetto
						{isEditing && (
							<div className="project-users-form">
								<label>
									<SearchForm onItemClick={addUser} list={project.accessList} />
								</label>
							</div>
						)}
						<div className="project-users-container">
							{project.accessList.map((u) => (
								<div className="project-user-box">
									{u}
									{isEditing && (
										<button
											style={{
												marginLeft: "0.5em",
												padding: "0",
												backgroundColor: "#d64545",
											}}
											className="project-user-delete"
											onClick={(
												e: React.MouseEvent<HTMLButtonElement>
											): void => deleteUser(e, u)}>
											X
										</button>
									)}
								</div>
							))}
						</div>
					</label>
					{/* render activity list */}
					<div className="project-activities-container">
						{!activityFormOpen ? (
							<>
								<label className="project-activities-label">
									Attività legate al progetto
									{project.activityList &&
										project.activityList.map((a) => (
											<div
												key={"activity-" + a.id}
												className="project-activity-item">
												<a href={`/activity/${a.id}`}>{a.title}</a>

												{isEditing && (
													<>
														<button
															style={{
																backgroundColor: "#3a7a3c",
																padding: "5px",
															}}
															className="project-activity-edit"
															onClick={(
																e: React.MouseEvent<HTMLButtonElement>
															): void => toggleEditActivity(e, a.id)}>
															Modifica
														</button>

														<button
															style={{
																backgroundColor: "#d64545",
																padding: "5px",
															}}
															className="project-activity-delete"
															onClick={async (
																e: React.MouseEvent<HTMLButtonElement>
															): Promise<void> =>
																await handleDeleteActivity(e, a.id)
															}>
															Elimina
														</button>
													</>
												)}
											</div>
										))}
								</label>
								{isEditing && (
									<button
										className="project-activity-create"
										onClick={handleCreateActivityOpen}>
										Crea Attività
									</button>
								)}
							</>
						) : (
							<label className="project-activity-form">
								Aggiungi Attività al progetto
								<ActivityForm
									inputActivity={currentActivity}
									projectId={project.id}
									onSuccess={async (): Promise<void> => {
										setActivityFormOpen(false);
										alert("Attività creata con successo");
										await updateProject();
									}}
									onFail={(): void => {
										setMessage("Errore nel creare attività");
									}}
									siblings={getListOfActivities()}
								/>
								<button
									className="project-activity-cancel"
									onClick={(): void => {
										setActivityFormOpen(false);
									}}>
									Annulla
								</button>
							</label>
						)}
					</div>
					{/* render note */}

					{/* manage project */}
					{/* if is owner, can modify project */}
					{/* if new project, can save new project */}
					{id === NEW ? (
						<button onClick={handleCreateProject}>Crea nuovo progetto</button>
					) : isEditing ? (
						<button style={{ backgroundColor: "green" }} onClick={handleUpdateProject}>
							Salva progetto
						</button>
					) : (
						<button onClick={toggleEdit}>Modifica progetto</button>
					)}
					{/* if is owner, can delete project (not new project) */}
					{id !== NEW && (
						<button style={{ backgroundColor: "red" }} onClick={handleDeleteProject}>
							Cancella Progetto
						</button>
					)}
				</div>
			</div>

			{message && <div>{message}</div>}
		</>
	);
}
