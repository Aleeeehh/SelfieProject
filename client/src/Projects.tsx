import React from "react";
import { SERVER_API } from "./params/params";
import type { ResponseBody } from "./types/ResponseBody";
import type Project from "./types/Project";
import { useNavigate } from "react-router-dom";
import { ResponseStatus } from "./types/ResponseStatus";
import ProjectList from "./ProjectList";
import GanttDiagram from "./ProjectGantt";

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
					justifyContent: "space-around",
					alignItems: "center",
				}}>
				<div className="filter">
					<div style={{ color: "black" }}>Seleziona la vista:</div>
					<select onChange={(e): void => setView(e.target.value as View)} value={view}>
						<option value={View.LIST}>List</option>
						<option value={View.GANTT}>Gantt</option>
					</select>
				</div>
				{/* Filter for user */}
				<div className="filter">
					<div>Filtra per utente: </div>
					<select value={filter} onChange={(e): void => setFilter(e.target.value)}>
						<option value="">Tutti</option>
						{getAllUsers().map((user) => (
							<option value={user}>{user}</option>
						))}
					</select>
				</div>
			</div>
			{view === View.LIST ? (
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
			)}
		</div>
	);
}
