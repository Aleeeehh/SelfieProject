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
import { useAuth } from "./AuthContext";

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
	const [isOwner, setIsOwner] = React.useState(false);
	const { loggedUser } = useAuth();
	// const [isPreview, setIsPreview] = React.useState(false);

	const nav = useNavigate();

	async function updateProject(): Promise<void> {
		if (id !== NEW)
			fetch(`${SERVER_API}/projects/${id}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.status === ResponseStatus.GOOD) {
						setProject(data.value as Project);
						setIsOwner(
							id === NEW ||
								data.value.owner === loggedUser?.id ||
								data.value.owner === loggedUser?.username
						);
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
				alert("Nota modificata correttamente!");

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
	function toggleEditActivity(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setIsEditing(!isEditing);
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
					<div className="page-title">
						{id === NEW ? "Crea un nuovo progetto" : "Modifica progetto"}
					</div>
					{/* render title */}
					{isOwner && isEditing ? (
						<label htmlFor="title">
							Titolo
							<input name="title" value={project.title} onChange={handleChange} />
						</label>
					) : (
						<div className="project-title">{project.title}</div>
					)}
					{/* render description */}
					{isOwner && isEditing ? (
						<label htmlFor="description">
							Descrizione
							<input
								name="description"
								value={project.description}
								onChange={handleChange}
							/>
						</label>
					) : (
						<div className="project-description">{project.description}</div>
					)}
					{/* render access list */}
					<div>
						{isOwner && isEditing && (
							<>
								<div>Aggiungi partecipanti al progetto</div>
								<SearchForm onItemClick={addUser} list={project.accessList} />
							</>
						)}
						<div>
							{project.accessList.map((u) => (
								<div>
									<div>{u}</div>
									{isOwner && isEditing && (
										<button
											onClick={(
												e: React.MouseEvent<HTMLButtonElement>
											): void => deleteUser(e, u)}>
											Elimina
										</button>
									)}
								</div>
							))}
						</div>
					</div>

					{/* render activity list */}
					<div>
						<div>Lista di Attività legate al progetto</div>
						{project.activityList &&
							project.activityList.map((a) => (
								<div key={"activity-" + a.id}>
									<div>{a.title}</div>

									{!activityFormOpen && (
										<button onClick={toggleEditActivity}>Modifica</button>
									)}

									{isOwner && isEditing && (
										<button
											onClick={async (
												e: React.MouseEvent<HTMLButtonElement>
											): Promise<void> =>
												await handleDeleteActivity(e, a.id)
											}>
											Elimina
										</button>
									)}
								</div>
							))}
						{!activityFormOpen ? (
							<button
								onClick={(): void => {
									setActivityFormOpen(true);
								}}>
								Crea Attività
							</button>
						) : (
							<div>
								<ActivityForm
									projectId={project.id}
									onSuccess={async (): Promise<void> => {
										setActivityFormOpen(false);
										alert("Attività creata con successo");
										await updateProject();
									}}
									onFail={(): void => {
										setMessage("Errore nel creare attività");
									}}
								/>
								<button
									onClick={(): void => {
										setActivityFormOpen(false);
									}}>
									Annulla
								</button>
							</div>
						)}
					</div>
					{/* render note */}

					{/* manage project */}
					{id !== NEW && (
						<button onClick={toggleEdit}>
							{isOwner && isEditing ? "Salva modifiche" : "Modifica progetto"}
						</button>
					)}
					{isOwner && isEditing && (
						<button
							style={{ backgroundColor: "blue" }}
							onClick={id === NEW ? handleCreateProject : handleUpdateProject}>
							{id === NEW ? "Crea Progetto" : "Aggiorna progetto"}
						</button>
					)}
					{id !== NEW && !isEditing && (
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
