import React, { useState } from "react";
import { SERVER_API } from "./lib/params";
import type { ResponseBody } from "./types/ResponseBody";
import type Project from "./types/Project";
import { Link } from "react-router-dom";
//import { useNavigate } from "react-router-dom";

const PREVIEW_CHARS = 100;
const MAX_TITLE_CHARS = 17;
const MAX_USERS_CHARS = 50;

export default function ProjectList({ projects, onProjectDelete }: { projects: Project[], onProjectDelete: () => void }): React.JSX.Element {

	const [confirmDelete, setConfirmDelete] = useState(false);
	const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

	//const nav = useNavigate();

	const userId = localStorage.getItem("loggedUserId");



	/*async function handleDelete(
		e: React.MouseEvent<HTMLButtonElement>,
		id: string | undefined
	): Promise<void> {
		e.preventDefault();

		if (!id) {
			alert("Errore nella cancellazione del progetto: id non trovato. Errore del server?");
			return;
		}

		try {
			const res = await fetch(`${SERVER_API}/projects/${id}`, {
				method: "DELETE",
			});
			const resBody = (await res.json()) as ResponseBody;
			console.log(resBody);
			if (res.status === 200) {
				console.log("Progetto cancellato correttamente!");
				nav("/projects", { replace: true });
				onProjectDelete();
			} else {
				alert(resBody.message || "Errore nella cancellazione del progetto");
			}
		} catch (e) {
			alert("Impossibile raggiungere il server");
		}
	}*/

	async function handleDelete(id: string): Promise<void> {
		if (!id) {
			alert("Errore nella cancellazione del progetto: id non trovato. Errore del server?");
			return;
		}

		try {
			const res = await fetch(`${SERVER_API}/projects/${id}`, {
				method: "DELETE",
			});

			const resBody = (await res.json()) as ResponseBody;

			if (res.status === 200) {
				console.log("Progetto cancellato correttamente!");
				onProjectDelete(); // Aggiorna la lista dei progetti
				setConfirmDelete(false); // Chiude il popup
				setProjectToDelete(null); // Resetta il progetto selezionato
			} else {
				alert(resBody.message || "Errore nella cancellazione del progetto");
			}
		} catch (e) {
			alert("Impossibile raggiungere il server");
		}
	}



	return (
		<>
			<div className="projects-list">
				{projects.map((project) => (
					<Link to={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
						<div className="card-project" style={{ cursor: "pointer" }}>
							<div className="card-project-title">
								<h3>
									{project.title.length > MAX_TITLE_CHARS
										? project.title.substring(0, MAX_TITLE_CHARS) + "..."
										: project.title}
								</h3>
							</div>
							<div className="card-project-description">
								<p>
									{project.description.length > PREVIEW_CHARS
										? project.description.substring(0, PREVIEW_CHARS) + "..."
										: project.description}
								</p>
							</div>
							<div className="card-project-users">
								<p style={{ color: "black" }}>
									Partecipanti:{" "}
									<i>
										{(project.accessList.join(", ")).length > MAX_USERS_CHARS
											? (project.accessList.join(", ")).substring(0, MAX_USERS_CHARS) + "..."
											: project.accessList.join(", ")}
									</i>
								</p>
							</div>
							<div className="card-project-buttons">
								{/*
								<button
									onClick={(): void =>
										window.location.assign(`/projects/${project.id}`)
									}>
									Visualizza
								</button>
*/}
								{project.owner === userId && (
									<button
										style={{ backgroundColor: "#ff6b6b" }}
										onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
											e.preventDefault(); // Previene comportamenti indesiderati
											setConfirmDelete(true); // Mostra il popup di conferma
											setProjectToDelete(project.id || null); // Imposta il progetto selezionato per l'eliminazione
										}}
									>
										Cancella
									</button>
								)}
							</div>
							<div className="confirmDelete-background"
								style={{ display: confirmDelete ? "flex" : "none" }}
							>
								<div className="confirmDelete-container">
									<h2>Stai eliminando un progetto. Vuoi procedere?</h2>
									<div
										style={{ display: "flex", gap: "2em" }}
									>
										<button
											style={{ backgroundColor: "#ff6b6b" }}
											onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
												e.preventDefault();
												setConfirmDelete(false);
												setProjectToDelete(null);
											}}
										>
											Annulla
										</button>
										<button
											onClick={async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
												e.preventDefault();
												if (projectToDelete) {
													await handleDelete(projectToDelete);
													setProjectToDelete(null);
													setConfirmDelete(false);
												}
											}}
										>
											Continua
										</button>
									</div>
								</div>
							</div>
						</div>
					</Link>
				))}




				{/*{projects.map((project) => (
					<div className="card-project">
						<div className="card-project-title">
							<h3>
								{project.title.length > MAX_TITLE_CHARS
									? project.title.substring(0, MAX_TITLE_CHARS) + "..."
									: project.title}
							</h3>
						</div>
						<div className="card-project-description">
							<p>
								{project.description.length > PREVIEW_CHARS
									? project.description.substring(0, PREVIEW_CHARS) + "..."
									: project.description}
							</p>
						</div>
						<div className="card-project-users">
							<p>
								Partecipanti:{" "}
								<i>
									{(project.accessList.join(", ")).length > MAX_USERS_CHARS
										? (project.accessList.join(", ")).substring(0, MAX_USERS_CHARS) + "..."
										: project.accessList.join(", ")}
								</i>
							</p>
						</div>
						<div className="card-project-buttons">
							<button
								onClick={(): void =>
									window.location.assign(`/projects/${project.id}`)
								}>
								Visualizza
							</button>
							{project.owner === userId && (
								<button
									style={{ backgroundColor: "#ff6b6b" }}
									onClick={async (
										e: React.MouseEvent<HTMLButtonElement>
									): Promise<void> => handleDelete(e, project.id)}>
									Cancella
								</button>
							)}
						</div>
					</div>
				))}*/}

			</div>
		</>
	);
}
