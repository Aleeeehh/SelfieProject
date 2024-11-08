import React from "react";
import { SERVER_API } from "./params/params";
import type { ResponseBody } from "./types/ResponseBody";
import type Project from "./types/Project";

export default function Projects(): React.JSX.Element {
	const [message, setMessage] = React.useState("");
	const [projects, setProjects] = React.useState([] as Project[]);

	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/projects`);

				const resBody = (await res.json()) as ResponseBody;
				console.log(resBody);

				if (res.status === 200) {
					setProjects(resBody.value as Project[]);
				} else {
					setMessage(resBody.message || "Errore nel ritrovamento dei progetti");
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

	return (
		<>
			{message && <div>{message}</div>}
			<div>
				{projects.map((project) => (
					<div>
						<div key={project.id}>{project.title}</div>

						<a href={`/projects/${project.id}`}>
							<button>Vedi Dettaglio</button>
						</a>
						<button
							onClick={async (
								e: React.MouseEvent<HTMLButtonElement>
							): Promise<void> => handleDelete(e, project.id)}>
							Cancella
						</button>
					</div>
				))}
			</div>
			<a href={`/projects/new`}>
				<button>Crea nuovo progetto</button>
			</a>
		</>
	);
}
