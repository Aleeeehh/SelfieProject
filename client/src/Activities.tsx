import React from "react";
import { SERVER_API } from "./lib/params";
import type { ResponseBody } from "./types/ResponseBody";
// import { useNavigate } from "react-router-dom";
import { ResponseStatus } from "./types/ResponseStatus";
import type Activity from "./types/Activity";

const PREVIEW_CHARS = 100;
const MAX_TITLE_CHARS = 17;

enum SORT {
	PROJECT = "project",
	NAME = "name",
	DEADLINE = "deadline",
	STARTDATE = "startDate",
}

export default function Activities(): React.JSX.Element {
	const [message, setMessage] = React.useState("");
	const [activities, setActivities] = React.useState([] as Activity[]);
	const [userFilter, setUserFilter] = React.useState("");
	const [projectFilter, setProjectFilter] = React.useState("");
	const [sortFilter, setSortFilter] = React.useState<SORT>(SORT.PROJECT);

	const userId = localStorage.getItem("loggedUserId");

	// const nav = useNavigate();

	function getAllUsers(): string[] {
		const users: string[] = [];
		activities.forEach((act) => {
			act.accessList.forEach((user) => {
				if (!users.includes(user)) {
					users.push(user);
				}
			});
		});
		return users;
	}

	function getAllProjectNames(): string[] {
		const projects: string[] = [];
		activities.forEach((act) => {
			if (act.projectId && !projects.includes(act.projectId)) {
				projects.push(act.projectId);
			}
		});
		return projects;
	}

	function updateActivities(): void {
		fetch(`${SERVER_API}/activities`)
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					setActivities(data.value as Activity[]);
					console.log(data.value);
				} else {
					console.log(data.message || "Errore nel caricamento delle attività");
					// nav("/projects");
				}

				console.log("Getting all project names");
			})

			.catch(() => {
				setMessage("Impossibile raggiungere il server");
				// nav("/projects");
			});
	}

	// On page load, get the events for the user
	React.useEffect(() => {
		updateActivities();
	}, []);

	async function handleDelete(
		e: React.MouseEvent<HTMLButtonElement>,
		id: string | undefined
	): Promise<void> {
		e.preventDefault();

		if (!id) {
			setMessage(
				"Errore nel cancellamento dell'attività: id non trovato. Errore del server?"
			);
			return;
		}

		try {
			const res = await fetch(`${SERVER_API}/activities/${id}`, {
				method: "DELETE",
			});
			const resBody = (await res.json()) as ResponseBody;
			console.log(resBody);
			if (res.status === 200) {
				updateActivities();
			} else {
				setMessage(resBody.message || "Errore nel cancellamento dell'attività");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	return (
		<>
			{message && <div>{message}</div>}
			<div className="activities-container">
				<a href={`/activities/new`} style={{ marginTop: "1em" }}>
					<button>Crea nuova attività</button>
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
						<div style={{ color: "black" }}>Filtra per progetto:</div>
						<select
							className="sort-select"
							onChange={(e): void => {
								console.log(e.target.value);
								setProjectFilter(e.target.value);
							}}
							value={projectFilter}>
							<option value="">Tutti</option>
							<option value="no-project">Senza progetto</option>
							{getAllProjectNames().map((project) => (
								<option value={project}>{project}</option>
							))}
						</select>
					</div>
					{/* Filter for user */}
					<div className="sort-label">
						<div>Filtra per utente: </div>
						<select
							className="sort-select"
							value={userFilter}
							onChange={(e): void => {
								console.log(e.target.value);
								setUserFilter(e.target.value);
							}}>
							<option value="">Tutti</option>
							{getAllUsers().map((user) => (
								<option value={user}>{user}</option>
							))}
						</select>
					</div>
					<div className="sort-label">
						<div>Ordina per: </div>
						<select
							className="sort-select"
							value={sortFilter}
							onChange={(e): void => {
								console.log(e.target.value);
								setSortFilter(e.target.value as SORT);
							}}>
							<option value={SORT.PROJECT}>Progetto</option>
							<option value={SORT.NAME}>Titolo</option>
							<option value={SORT.DEADLINE}>Scadenza</option>
							<option value={SORT.STARTDATE}>Inizio</option>
						</select>
					</div>
				</div>
				<div className="activities-list">
					{activities
						.filter((act) => {
							if (!projectFilter) return true;
							if (projectFilter === "no-project") return !act.projectId;
							return act.projectId === projectFilter;
						})
						.filter((act) => {
							if (!userFilter) return true;
							return act.accessList.includes(userFilter);
						})
						.sort((a, b) => {
							switch (sortFilter) {
								case SORT.PROJECT:
									if (!a.projectId && b.projectId)
										return a.title.localeCompare(b.title);
									if (!a.projectId) return 1;
									if (!b.projectId) return -1;
									return a.projectId.localeCompare(b.projectId);
								case SORT.NAME:
									return a.title.localeCompare(b.title);
								case SORT.DEADLINE:
									return (
										new Date(a.deadline).getTime() -
										new Date(b.deadline).getTime()
									);
								case SORT.STARTDATE:
									if (!a.start && b.start) return a.title.localeCompare(b.title);
									if (!a.start) return 1;
									if (!b.start) return -1;
									return (
										new Date(a.start).getTime() - new Date(b.start).getTime()
									);
								default:
									return 0;
							}
						})
						.map((activity) => (
							<div className="card-activity" key={activity.id}>
								<div className="card-activity-title">
									<h3>
										{activity.title.length > MAX_TITLE_CHARS
											? activity.title.substring(0, MAX_TITLE_CHARS) + "..."
											: activity.title}
										</h3>
								</div>
								<div className="card-activity-description">
									<p>
										{activity.description.length > PREVIEW_CHARS
											? activity.description.substring(0, PREVIEW_CHARS) +
											  "..."
											: activity.description}
									</p>
								</div>
								<div className="card-activity-buttons">
									<a href={`/activities/${activity.id}`}>
										<button>Visualizza</button>
									</a>
									{activity.owner === userId && (
										<button
											style={{ backgroundColor: "#ff6b6b" }}
											onClick={async (
												e: React.MouseEvent<HTMLButtonElement>
											): Promise<void> => handleDelete(e, activity.id)}>
											Cancella
										</button>
									)}
								</div>
							</div>
						))}
				</div>
			</div>
		</>
	);
}
