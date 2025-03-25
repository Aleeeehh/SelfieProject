import React from "react";
import { SERVER_API } from "./lib/params";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Note, { type ListItem } from "./types/Note";
import { useNavigate, useParams } from "react-router-dom";
import { Privacy } from "./types/Privacy";
import SearchForm from "./SearchForm";
import type Project from "./types/Project";
import type Activity from "./types/Activity";
import { useRefresh } from "./TimeContext";
import { getActivityStatus } from "./lib/helpers";

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
	accessListAccepted: [] as string[],
};

export default function ProjectPage(): React.JSX.Element {
	const { id } = useParams();
	const [project, setProject] = React.useState(baseProject);
	const [message, setMessage] = React.useState("");
	const [isEditing, setIsEditing] = React.useState(false);
	const [isOwner, setIsOwner] = React.useState(false);

	const [confirmDelete, setConfirmDelete] = React.useState(false);

	const { serverTime } = useRefresh();

	const loggedUser = {
		username: localStorage.getItem("loggedUserName"),
		id: localStorage.getItem("loggedUserId"),
	};

	const nav = useNavigate();

	async function refreshProject(): Promise<void> {
		fetch(`${SERVER_API}/projects/${id}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					setProject(data.value as Project);
					console.log(data.value);

					// Controlla se l'utente è il proprietario
					setIsOwner(data.value.owner === (loggedUser.id as string));
				} else {
					console.log(data.message || "Errore nel caricamento del progetto");
					nav("/projects");
				}
			})
			.catch(() => {
				setMessage("Impossibile raggiungere il server");
				console.log("Impossibile raggiungere il server");
				nav("/projects");
			});
	}

	React.useEffect(() => {
		if (!isEditing) refreshProject();
	}, [serverTime]);

	React.useEffect(() => {
		refreshProject();
	}, []);

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setProject({ ...project, [e.target.name]: e.target.value });
	}

	async function handleUpdateProject(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		if (project.title === "") {
			setMessage("Inserire un titolo valido");
			return;
		}

		if (project.description === "") {
			setMessage("Inserire una descrizione valida");
			return;
		}

		// TODO: validate inputs (not empty, max length)
		try {
			const res = await fetch(`${SERVER_API}/projects/${id}`, {
				method: "PUT",
				body: JSON.stringify({
					title: project.title,
					description: project.description,
					accessList: project.accessList,
				}),
				headers: { "Content-Type": "application/json" },
			});

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				console.log("Progetto aggiornato correttamente!");

				await refreshProject();

				setIsEditing(false);

				console.log(resBody.value as Note);
			} else {
				setMessage(resBody.message || "Errore nell'aggiornamento del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
		setMessage("");
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
				console.log("Progetto cancellato correttamente!");
				nav("/projects", { replace: true });
			} else {
				setMessage(resBody.message || "Errore della cancellazione del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
		setMessage("");

		setConfirmDelete(false);
	}

	function toggleEdit(e: React.MouseEvent<HTMLButtonElement>): void {
		if (isEditing) {
			handleUpdateProject(e);
		}

		setIsEditing(!isEditing);
		setMessage("");
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

	React.useEffect(() => {
		const handleEscKey = (event: KeyboardEvent): void => {
			if (event.key === 'Escape') {
				window.location.href = '/projects';
			}
		};

		window.addEventListener('keydown', handleEscKey);

		return () => {
			window.removeEventListener('keydown', handleEscKey);
		};
	}, []);

	return (
		<>
			<div className="project-background">
				<div className="project-container">
					<div className="project-page-title">
						{isEditing ? "Modifica progetto" : "Visualizza progetto"}
						<a href="/projects" className="project-close-link">
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
						Utenti partecipanti al progetto:
						{isEditing && (
							<div className="project-users-form">
								<label>
									<SearchForm onItemClick={addUser} list={project.accessList} />
								</label>
							</div>
						)}
						<div className="project-users-container">
							{project.accessList.length > 0 ? (
								project.accessList.map((u) => (
									<div className="project-user-box">{u}</div>
								))
							) : (
								<div style={{ fontWeight: "normal" }}>Nessun partecipante</div>
							)}
						</div>
					</label>

					{/* render activity list */}
					<div className="project-activities-container">
						<label className="project-activities-label">
							Attività legate al progetto:
							{project.activityList &&
								(project.activityList.length ? (
									project.activityList.map((a) => (
										<div
											key={"activity-" + a.id}
											className="project-activity-item">
											<a href={`/activities/${a.id}`}>
												{a.title} ({getActivityStatus(serverTime, a)})
											</a>

											{isEditing && (
												<>
													<a
														href={`/activities/new?projectId=${project.id}&parent=${a.id}`}>
														<button>Aggiungi Sotto-Attività</button>
													</a>
													<a
														href={`/activities/new?projectId=${project.id}&parent=${a.id}&next=${a.id}`}>
														<button>
															Aggiungi Attività Precedente
														</button>
													</a>
												</>
											)}

											{a.children &&
												a.children.map((c) => (
													<div className="project-activity-child">
														<a href={`/activities/${c.id}`}>
															Sottoattività: {c.title}{" "}
															(getActivityStatus(serverTime, c))
														</a>
													</div>
												))}
										</div>
									))
								) : (
									<div style={{ fontWeight: "normal" }}>Nessuna attività</div>
								))}
						</label>

						{isEditing && (
							<label className="project-activity-form">
								<a href={`/activities/new?projectId=${project.id}`}>
									<button style={{ backgroundColor: "#b6b6e3", color: "white" }}>Aggiungi Attività al progetto</button>
								</a>
							</label>
						)}
					</div>
					{isOwner && (
						<>
							{message && <div className="error-message">{message}</div>}
							{isEditing ? (
								<button
									style={{ backgroundColor: "#b6b6e3", color: "white" }}
									onClick={handleUpdateProject}>
									Salva progetto
								</button>
							) : (
								<button style={{ backgroundColor: "#b6b6e3", color: "white" }} onClick={toggleEdit}>Modifica progetto</button>
							)}
							{/* if is owner, can delete project (not new project) */}
							<button
								style={{ backgroundColor: "#d64545" }}
								onClick={(): void => setConfirmDelete(true)}>
								Cancella Progetto
							</button>
							<div
								className="confirmDelete-background"
								style={{ display: confirmDelete ? "flex" : "none" }}>
								<div className="confirmDelete-container">
									<h2>Stai eliminando un progetto. Vuoi procedere?</h2>
									<div style={{ display: "flex", gap: "2em" }}>
										<button
											style={{ backgroundColor: "#ff6b6b" }}
											onClick={(): void => setConfirmDelete(false)}>
											Annulla
										</button>
										<button style={{ backgroundColor: "#4a90e2" }} onClick={handleDeleteProject}>Continua</button>
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
}
