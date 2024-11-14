import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseStatus } from "./types/ResponseStatus";
import { useNavigate, useParams } from "react-router-dom";
// import { marked } from "marked";
// import UserResult from "./types/UserResult";
import type Activity from "./types/Activity";
import { ActivityStatus, AdvancementType } from "./types/Activity";

//TODO: aggiungere un bottone per uscire dalla creazione di una nota
const dummyActivity: Activity = {
	id: "6735dd4a516cf3e8d510ae08",
	owner: "6735dc1c5d397ea3c3e2b616",
	title: "testtitle",
	description: "test",
	createdAt: new Date("2024-11-14T11:21:46.325Z"),
	updatedAt: new Date("2024-11-14T11:21:46.325Z"),
	deadline: new Date("2024-11-11T00:00:00.000Z"),
	completed: false,
	accessList: ["fv2"],
	projectId: "6735dc405d397ea3c3e2b63b",
	next: null,
	status: ActivityStatus.ACTIVABLE,
	milestone: false,
	advancementType: AdvancementType.TRANSLATION,
	parent: null,
	// start: new Date("2024-11-10T00:00:00.000Z"),
	children: [
		{
			id: "6735e7226c68b78ecea68fd6",
			title: "testtitle",
			description: "test",
			deadline: new Date("2024-11-11T00:00:00.000Z"),
			completed: false,
			owner: "6735dc1c5d397ea3c3e2b616",
			accessList: ["fv2"],
			projectId: "6735dc405d397ea3c3e2b63b",
			// start: new Date("2024-11-10T00:00:00.000Z"),
			milestone: null,
			advancementType: null,
			parent: "6735dd4a516cf3e8d510ae08",
			next: null,
			status: ActivityStatus.ACTIVABLE,
			children: [],
		},
	],
};

export default function ActivityPage(): React.JSX.Element {
	const { id } = useParams();
	const [message, setMessage] = React.useState("");
	const [activity, setActivity] = React.useState<Activity>(dummyActivity);

	const nav = useNavigate();

	async function updateActivity(): Promise<void> {
		fetch(`${SERVER_API}/activity/${id}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					setActivity(data.value as Activity);
					console.log(data.value);
				} else {
					console.log(data.message || "Errore nel caricamento dell'attività");
					nav("/activities");
				}
			})
			.catch(() => {
				setMessage("Impossibile raggiungere il server");
				// nav("/projects");
			});
	}

	// On page load, get the project data
	React.useEffect(() => {
		updateActivity();
	}, []);

	return (
		<>
			<div className="activity-background">
				<div className="activity-container">
					<div className="activity-page-title">
						<a href="/activities" className="close-link">
							X
						</a>
					</div>
					{/* render title */}
					<div className="activity-title">{activity.title}</div>
					{/* render description */}
					<div className="activity-description">{activity.description}</div>
					{/* render project */}
					{activity.projectId && (
						<div className="activity-project">
							<div>
								Questa attività fa parte di un progetto:{" "}
								<a href={`/projects/${activity.projectId}`}>{activity.projectId}</a>
							</div>
						</div>
					)}
					{/* render completed */}
					<div className="activity-completed">
						<div>{activity.completed}</div>
					</div>
					{/* render status */}
					<div className="activity-status">
						<div>{activity.status}</div>
					</div>
					{/* render milestone */}
					<div className="activity-milestone">
						<div>{activity.milestone}</div>
					</div>
					{/* render advancement type */}
					<div className="activity-advancementType">
						<div>{activity.advancementType}</div>
					</div>
					{/* render dates */}
					<div className="activity-dates">
						<div>Da completare entro: {new Date(activity.deadline).toISOString()}</div>
					</div>
					{/* render description */}
					<div className="note-description">{activity.description}</div>
					{/* render access list */}
					<label>
						Utenti partecipanti all'attività
						<div className="activity-users-container">
							{activity.accessList.map((u) => (
								<div className="activity-user-box">{u}</div>
							))}
						</div>
					</label>
					{/* parent*/}
					{activity.parent && (
						<a href={"/activities/" + activity.parent}>
							<div>See parent: {activity.parent}</div>
						</a>
					)}
					{/* render children list */}
					<div>
						<div>sotto-attività</div>
						{activity.children &&
							activity.children.map((a) => (
								<a href={"/activities/" + a.id}>
									<div>{a.title}</div>
								</a>
							))}
					</div>
				</div>
			</div>

			{message && <div>{message}</div>}
		</>
	);
}
