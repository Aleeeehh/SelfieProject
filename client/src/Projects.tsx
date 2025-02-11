import React from "react";
import { SERVER_API } from "./lib/params";
import type Project from "./types/Project";
import { useNavigate } from "react-router-dom";
import ProjectList from "./ProjectList";
import GanttDiagram from "./ProjectGantt";
import type User from "./types/User";

enum View {
	LIST = "list",
	GANTT = "gantt",
}

export default function Projects(): React.JSX.Element {
	const [projects, setProjects] = React.useState([] as Project[]);
	const [view, setView] = React.useState<View>(View.LIST);
	const [filter, setFilter] = React.useState(""); // Username utente filtro

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
				console.log("Utente non autenticato");
				return null;
			}
			const data: User = await res.json();
			return data;
		} catch (e) {
			console.log("Impossibile recuperare l'utente corrente");
			return null;
		}
	}


	const loadProjects = async (): Promise<void> => {
		try {
			console.log("Entro nella project page");

			const currentUser = await getCurrentUser();
			if (!currentUser) {
				nav("/login");
				return;
			}
			const userId = currentUser.value._id.toString();
			const username = currentUser.value.username;
			console.log("DOPO CURRENT USER:", userId);

			const res = await fetch(`${SERVER_API}/projects`);
			if (!res.ok) {
				nav("/login");
				return;
			}
			const data = await res.json();
			const progetti = data.value;
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

		} catch (e) {
			console.log("Impossibile raggiungere il server");
		}
	};


	React.useEffect(() => {
		loadProjects();
	}, []);

	return (
		<div className="projects-container">
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
						onProjectDelete={loadProjects}
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
