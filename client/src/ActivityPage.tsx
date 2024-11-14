import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseStatus } from "./types/ResponseStatus";
import { useNavigate, useParams } from "react-router-dom";
// import { marked } from "marked";
// import UserResult from "./types/UserResult";
import type Activity from "./types/Activity";
import { ActivityStatus, AdvancementType } from "./types/Activity";
import type Project from "./types/Project";
import DatePicker from "react-datepicker";

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
	const [project, setProject] = React.useState<Project | null>(null);
	const [isEditing, setIsEditing] = React.useState(false);

	const nav = useNavigate();

	function updateActivity(): void {
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

	function updateProject(): void {
		if (activity.projectId)
			fetch(`${SERVER_API}/projects/${activity.projectId}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.status === ResponseStatus.GOOD) {
						setProject(data.value as Project);
						console.log(data.value);
					} else {
						console.log(data.message || "Errore nel caricamento del progetto");
						// nav("/projects");
					}
				})
				.catch(() => {
					setMessage("Impossibile raggiungere il server");
					// nav("/projects");
				});
	}

	function updatePage(): void {
		updateActivity();
		updateProject();
	}

	function handleTextChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setActivity({ ...activity, [e.target.name]: e.target.value });
	}

	function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>): void {
		setActivity({ ...activity, [e.target.name]: e.target.checked });
	}

	function getPossibleNext(a: Activity[]): { id: string; title: string }[] {
		let possibleNext: { id: string; title: string }[] = [];

		for (const child of a) {
			if (child.id === activity.id) continue;
		}
		return possibleNext;
	}

	// On page load, get the project data
	React.useEffect(() => {
		updatePage();
	}, []);

	return (
		<>
			<div className="activity-background">
				{!isEditing ? (
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
						{project && activity.projectId && (
							<div className="activity-project">
								<div>
									Questa attività fa parte di un progetto:{" "}
									<a href={`/projects/${activity.projectId}`}>{project.title}</a>
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
							<div>
								Da completare entro: {new Date(activity.deadline).toISOString()}
							</div>
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
				) : (
					<div className="activity-container">
						{/* render title */}
						<label className="activity-title">
							Titolo
							<input
								type="text"
								name="title"
								value={activity.title}
								onChange={handleTextChange}
							/>
						</label>
						{/* render description */}
						<label className="activity-description">
							Descrizione
							<input
								type="textarea"
								name="description"
								value={activity.description}
								onChange={handleTextChange}
							/>
						</label>
						{/* render project */}
						{project && activity.projectId && (
							<div className="activity-project">
								<div>
									Questa attività fa parte di un progetto:{" "}
									<a href={`/projects/${activity.projectId}`}>{project.title}</a>
								</div>
							</div>
						)}
						{/* render completed */}
						<label className="activity-completed">
							Completa?
							<input
								type="checkbox"
								name="completed"
								checked={activity.completed}
								onChange={handleCheckboxChange}
							/>
						</label>
						{/* render status */}
						<div className="activity-status">
							<div>{activity.status}</div>
						</div>

						{/* render milestone */}
						<label className="activity-milestone">
							Completa?
							<input
								type="checkbox"
								name="milestone"
								checked={activity.milestone || false}
								onChange={handleCheckboxChange}
							/>
						</label>
						{/* render advancement type */}
						<label htmlFor="advancementType" className="activity-vertical">
							<select
								style={{ backgroundColor: "white" }}
								className="btn border"
								name="advancementType"
								onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
									setActivity({
										...activity,
										advancementType: e.target.value as AdvancementType,
									});
								}}
								value={activity.advancementType || undefined}>
								<option
									key={AdvancementType.TRANSLATION}
									value={AdvancementType.TRANSLATION}>
									{AdvancementType.TRANSLATION}
								</option>
								<option
									key={AdvancementType.CONTRACTION}
									value={AdvancementType.CONTRACTION}>
									{AdvancementType.CONTRACTION}
								</option>
							</select>
						</label>
						{/* render dates */}
						<label htmlFor="endTime" className="activity-vertical">
							Scadenza
							<div>
								<DatePicker
									className="btn border"
									name="endTime"
									selected={activity.deadline}
									onChange={(date: Date | null): void => {
										if (date) {
											// Aggiorna la data mantenendo l'orario attuale
											const newDate = new Date(activity.deadline);
											newDate.setFullYear(
												date.getFullYear(),
												date.getMonth(),
												date.getDate()
											);
											setActivity({ ...activity, deadline: newDate });
										}
									}}
								/>
							</div>
							<div>
								<input
									style={{ backgroundColor: "white" }}
									className="btn border"
									type="time"
									value={`${new Date(activity.deadline)
										.getHours()
										.toString()
										.padStart(2, "0")}:${new Date(activity.deadline)
										.getMinutes()
										.toString()
										.padStart(2, "0")}`}
									onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
										const [hours, minutes] = e.target.value.split(":");
										const newDate = new Date(activity.deadline);
										newDate.setHours(Number(hours), Number(minutes)); // Aggiorna l'orario
										setActivity({ ...activity, deadline: newDate });
									}}
								/>
							</div>
						</label>

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
						<label htmlFor="parent" className="activity-vertical">
							<select
								style={{ backgroundColor: "white" }}
								className="btn border"
								name="parent"
								onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
									setActivity({
										...activity,
										parent: e.target.value,
									});
								}}>
								{/*

                                getPossibleParents().map((act) => (
									<option key={act.title} value={act.id}>
										{act.title}
									</option>
								))
                                    */}
							</select>
						</label>
						{/* next */}
						<label htmlFor="next" className="activity-vertical">
							<select
								style={{ backgroundColor: "white" }}
								className="btn border"
								name="next"
								onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
									setActivity({
										...activity,
										next: e.target.value,
									});
								}}>
								{project &&
									getPossibleNext(project.activityList).map((act) => (
										<option key={act.title} value={act.id}>
											{act.title}
										</option>
									))}
							</select>
						</label>
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
				)}
				<button
					onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
						e.preventDefault();
						setIsEditing(!isEditing);
						updatePage();
					}}>
					{isEditing ? "Termina modifiche" : "Modifica"}
				</button>
			</div>

			{message && <div>{message}</div>}
		</>
	);
}
