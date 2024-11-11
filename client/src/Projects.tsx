import React from "react";
import { SERVER_API } from "./params/params";
import type { ResponseBody } from "./types/ResponseBody";
import type Project from "./types/Project";
import { useNavigate } from "react-router-dom";
import { ResponseStatus } from "./types/ResponseStatus";

const PREVIEW_CHARS = 200;
export default function Projects(): React.JSX.Element {
	const [message, setMessage] = React.useState("");
	const [projects, setProjects] = React.useState([] as Project[]);

	const nav = useNavigate();


	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/projects`);
				if (res.status !== 200) {
					nav("/login");
				}
	
				const resBody = (await res.json()) as ResponseBody;
	
				if (resBody.status === ResponseStatus.GOOD) {
					setProjects(resBody.value);
				} else {
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);


	async function handleDelete(
		e: React.MouseEvent<HTMLButtonElement>,
		id: string | undefined
	): Promise<void> {
		e.preventDefault();

		if (!id) {
			setMessage("Errore nel cancellamento del progetto: id non trovato. Errore del server?");
			return;
		}

		try {
			const res = await fetch(`${SERVER_API}/projects/${id}`, {
				method: "DELETE",
			});
			const resBody = (await res.json()) as ResponseBody;
			console.log(resBody);
			if (res.status === 200) {
				const newProjects = projects.filter((project) => project.id !== id);
				setProjects(newProjects);
			} else {
				setMessage(resBody.message || "Errore nel cancellamento del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	//TODO: mettere una funzione di sorting dei progetti

	return (
		<>
			{message && <div>{message}</div>}
			<div className="projects-container">
				<a href={`/projects/new`} style={{ marginTop: "1em" }}>
					<button>Crea nuovo progetto</button>
				</a>
				<div className="projects-list">
					{projects.map((project) => (
						<div className="card-project">
							<div className="card-project-title">
								<h3>{project.title}</h3>
							</div>
							<div className="card-project-description">
                                <p>
                                    {project.description.length > PREVIEW_CHARS
										? project.description.substring(
											0,
											PREVIEW_CHARS
										) + "..."
									: project.description}
								</p>
							</div>
							<div className="card-project-buttons">
								<button
									onClick={(): void => 
										window.location.assign(`/projects/${project.id}`)}
								>
									Visualizza
								</button>
								<button
									style={{ backgroundColor: "#ff6b6b" }}
									onClick={async (
										e: React.MouseEvent<HTMLButtonElement>
									): Promise<void> => handleDelete(e, project.id)}
								>
									Cancella
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}
