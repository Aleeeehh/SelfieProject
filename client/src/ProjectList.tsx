import React from "react";
import { SERVER_API } from "./lib/params";
import type { ResponseBody } from "./types/ResponseBody";
import type Project from "./types/Project";
import { useNavigate } from "react-router-dom";

const PREVIEW_CHARS = 100;
const MAX_TITLE_CHARS = 17;
const MAX_USERS_CHARS = 50;

export default function ProjectList({ projects, onProjectDelete }: { projects: Project[], onProjectDelete: () => void }): React.JSX.Element {
	//const [message, setMessage] = React.useState("");


	const nav = useNavigate();

	const userId = localStorage.getItem("loggedUserId");



	async function handleDelete(
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
	}

	return (
		<>
			{/*message && <div className="error-message">{message}</div>*/}

			<div className="projects-list">
				{projects.map((project) => (
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
				))}
			</div>
		</>
	);
}
