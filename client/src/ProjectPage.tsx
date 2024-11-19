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

export default function ProjectPage(): React.JSX.Element {
	const { id } = useParams();
	const [project, setProject] = React.useState(baseProject);
	const [message, setMessage] = React.useState("");
	const [isEditing, setIsEditing] = React.useState(false);
	const [isOwner, setIsOwner] = React.useState(false);

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

					// then check if the user is the owner
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

	// On page load, get the project data
	React.useEffect(() => {
		refreshProject();
	}, []);

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setProject({ ...project, [e.target.name]: e.target.value });
	}

	async function handleUpdateProject(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

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
				alert("Progetto aggiornato correttamente!");

				await refreshProject();

				setIsEditing(false);

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

	function toggleEdit(e: React.MouseEvent<HTMLButtonElement>): void {
		if (isEditing) {
			handleUpdateProject(e);
		}

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
					<a href={`/projects/${id}/gantt`}>
						<div>Vai al GANTT del Progetto</div>
					</a>
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
							{project.accessList.length > 0 ? (
								project.accessList.map((u) => (
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
								))
							) : (
								<div>Nessun partecipante</div>
							)}
						</div>
					</label>
					{/* render activity list */}
					<div className="project-activities-container">
						<label className="project-activities-label">
							Attività legate al progetto
							{project.activityList &&
								(project.activityList.length ? (
									project.activityList.map((a) => (
										<div
											key={"activity-" + a.id}
											className="project-activity-item">
											<a
												href={`/activities/${a.id}`}
												style={{ width: "100%" }}>
												{a.title} - {a.status}
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

											<div>
												{a.children &&
													a.children.map((c) => (
														<div
															style={{
																backgroundColor: "gray",
															}}>
															<a href={`/activities/${c.id}`}>
																Child - {c.title} - {c.status}
															</a>
														</div>
													))}
											</div>
										</div>
									))
								) : (
									<div>Nessuna attività</div>
								))}
						</label>

						{isEditing && (
							<label className="project-activity-form">
								<a href={`/activities/new?projectId=${project.id}`}>
									<button>Aggiungi Attività al progetto</button>
								</a>
							</label>
						)}
					</div>
					{isOwner && (
						<>
							{isEditing ? (
								<button
									style={{ backgroundColor: "green" }}
									onClick={handleUpdateProject}>
									Salva progetto
								</button>
							) : (
								<button onClick={toggleEdit}>Modifica progetto</button>
							)}
							{/* if is owner, can delete project (not new project) */}
							<button
								style={{ backgroundColor: "red" }}
								onClick={handleDeleteProject}>
								Cancella Progetto
							</button>
						</>
					)}
				</div>
			</div>

			{message && <div>{message}</div>}
		</>
	);
}
