import React from "react";
import { SERVER_API } from "./lib/params";
import type { ResponseBody } from "./types/ResponseBody";
import type Project from "./types/Project";
import { useNavigate } from "react-router-dom";
import { ResponseStatus } from "./types/ResponseStatus";
import ProjectList from "./ProjectList";
import GanttDiagram from "./ProjectGantt";
import type User from "./types/User";

enum View {
	LIST = "list",
	GANTT = "gantt",
}

export default function Projects(): React.JSX.Element {
	const [message, setMessage] = React.useState("");
	const [projects, setProjects] = React.useState([] as Project[]);
	const [view, setView] = React.useState<View>(View.LIST);
	const [filter, setFilter] = React.useState(""); // username utente filtro

	const nav = useNavigate();

	function getAllUsers(): string[] {
		const users: string[] = [];
		projects.forEach((project) => {
			project.accessList.forEach((user) => {
				if (!users.includes(user)) {
					users.push(user);
				}
			});
		});
		return users;
	}

	async function getCurrentUser(): Promise<Promise<any> | null> {
		try {
			const res = await fetch(`${SERVER_API}/users`);
			if (!res.ok) {
				// Controlla se la risposta non è ok
				setMessage("Utente non autenticato");
				return null; // Restituisci null se non autenticato
			}
			//console.log("Questa è la risposta alla GET per ottenere lo user", res);
			const data: User = await res.json();
			//console.log("Questo è il json della risposta", data);
			return data;
		} catch (e) {
			setMessage("Impossibile recuperare l'utente corrente");
			return null;
		}
	}

	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				console.log("Entro nella project page");
				console.log("Entro nella project page");
				console.log("Entro nella project page");

				const currentUser = await getCurrentUser();
				if (!currentUser) {
					nav("/login");
					return;
				}
				const userId = currentUser.value._id.toString();
				const username = currentUser.value.username;
				console.log("DOPO CURRENT USER:", userId);

				console.log("DOPO CURRENT USER:", userId);
				console.log("DOPO CURRENT USER:", userId);
				console.log("DOPO CURRENT USER:", userId);

				const res = await fetch(`${SERVER_API}/projects`);
				if (!res.ok) {
					nav("/login");
					return;
				}
				const data = await res.json();
				const progetti = data.value;
				console.log("Progetti trovati:", progetti);
				console.log("Progetti trovati:", progetti);
				console.log("Progetti trovati:", progetti);

				let progettiDaVisualizzare: Project[] = [];

				for (const progetto of progetti) {
					console.log("Confronto:", {
						userId: userId,
						owner: progetto.owner,
						accessListAccepted: progetto.accessListAccepted
					});

					if (
						(progetto.accessListAccepted && progetto.accessListAccepted.includes(userId)) ||
						progetto.owner.toString() === userId ||
						progetto.owner.toString() === username ||
						progetto.accessListAccepted.includes(username)
					) {
						progettiDaVisualizzare.push(progetto);
					}
				}

				console.log("Progetti da visualizzare:", progettiDaVisualizzare);

				setProjects(progettiDaVisualizzare);



				const resBody = (await res.json()) as ResponseBody;

				if (resBody.status === ResponseStatus.GOOD) {
					setProjects(progettiDaVisualizzare);
				} else {
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	return (
		<div className="projects-container">
			{message && <div>{message}</div>}
			<a href={`/projects/new`} className="projects-filter">
				<button>Crea nuovo progetto</button>
			</a>
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					justifyContent: "center",
					gap: "1em",
					alignItems: "center",
					flexWrap: "wrap",
				}}>
				<div className="sort-label">
					<div style={{ color: "black" }}>Seleziona la vista:</div>
					<select
						className="sort-select"
						onChange={(e): void => setView(e.target.value as View)}
						value={view}>
						<option value={View.LIST}>List</option>
						<option value={View.GANTT}>Gantt</option>
					</select>
				</div>
				{/* Filter for user */}
				<div className="sort-label">
					<div>Filtra per utente: </div>
					<select
						className="sort-select"
						value={filter}
						onChange={(e): void => setFilter(e.target.value)}>
						<option value="">Tutti</option>
						{getAllUsers().map((user) => (
							<option value={user}>{user}</option>
						))}
					</select>
				</div>
			</div>
			{projects &&
				(view === View.LIST ? (
					<ProjectList
						projects={projects.filter((project) => {
							if (!filter) return true;
							else return project.accessList.includes(filter);
						})}
					/>
				) : (
					<GanttDiagram
						projects={projects.filter((project) => {
							if (!filter) return true;
							else return project.accessList.includes(filter);
						})}
					/>
				))}
		</div>
	);
}
