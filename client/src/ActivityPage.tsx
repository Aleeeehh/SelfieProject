import React from "react";
import { SERVER_API } from "./lib/params";
import { ResponseStatus } from "./types/ResponseStatus";
import { useNavigate, useParams } from "react-router-dom";
// import { marked } from "marked";
// import UserResult from "./types/UserResult";
import type Activity from "./types/Activity";
import { ActivityStatus, AdvancementType } from "./types/Activity";
import type Project from "./types/Project";
import DatePicker from "react-datepicker";
import SearchForm from "./SearchForm";
import { getActivityStatus } from "./lib/helpers";
import { useRefresh } from "./TimeContext";

// const baseActivity: Activity = {
// 	id: "",
// 	title: "",
// 	description: "",
// 	deadline: new Date(),
// 	owner: "",
// 	accessList: [] as string[],
// 	completed: false,
// 	// start: new Date(),
// };

//TODO: aggiungere un bottone per uscire dalla creazione di una nota
const dummyActivity: Activity = {
	id: "",
	owner: "",
	title: "",
	description: "",
	createdAt: new Date(""),
	updatedAt: new Date(""),
	deadline: new Date(""),
	completed: false,
	accessList: [],
	next: null,
	status: ActivityStatus.ACTIVABLE,
	milestone: false,
	advancementType: AdvancementType.TRANSLATION,
	parent: null,
	children: [],
};

export default function ActivityPage(): React.JSX.Element {
	const { id } = useParams();
	const [message, setMessage] = React.useState("");
	const [activity, setActivity] = React.useState<Activity>(dummyActivity);
	const [project, setProject] = React.useState<Project | null>(null);
	const [isEditing, setIsEditing] = React.useState(false);
	const [isUser, setIsUser] = React.useState(false);
	const [isOwner, setIsOwner] = React.useState(false);

	const { serverTime } = useRefresh();

	// handle share activity
	// const [shareActivity, setShareActivity] = React.useState(false);
	// const [shareList, setShareList] = React.useState([] as string[]); // username list

	const loggedUser = {
		username: localStorage.getItem("loggedUserName"),
		id: localStorage.getItem("loggedUserId"),
	};

	const nav = useNavigate();

	function refreshActivity(): void {
		fetch(`${SERVER_API}/activities/${id}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					setActivity(data.value as Activity);

					console.log("Attività: ", data.value);

					// then check if the user is in the access list
					setIsUser(
						loggedUser.username
							? (data.value as Activity).accessList.includes(loggedUser.username)
							: false
					);

					// then check if the user is the owner
					setIsOwner(
						loggedUser ? (data.value as Activity).owner === loggedUser.id : false
					);

					console.log(data.value, loggedUser);
				} else {
					console.log(data.message || "Errore nel caricamento dell'attività");
					nav("/activities");
				}
			})
			.then(() => refreshProject())
			.catch(() => {
				setMessage("Impossibile raggiungere il server");
				// nav("/projects");
			});
	}

	function refreshProject(): void {
		fetch(`${SERVER_API}/projects/${activity.projectId}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					setProject(data.value as Project);
					console.log("Progetto: ", data.value);
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

	function handleTextChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setActivity({ ...activity, [e.target.name]: e.target.value });
	}

	function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>): void {
		setActivity({ ...activity, [e.target.name]: e.target.checked });
	}

	function getPossibleNextList(a: Activity[]): { id: string; title: string }[] {
		let possibleNext: { id: string; title: string }[] = [];

		let found = false;
		for (const child of a) {
			if (child.id === activity.id) found = true;

			// recursive call
			possibleNext.concat(getPossibleNextList(child.children || []));
		}

		if (found) {
			for (const child of a) {
				if (child.id !== activity.id) {
					possibleNext.push({
						id: child.id || "",
						title: child.title,
					});
				}
			}
		}

		return possibleNext;
	}

	function addUser(e: React.ChangeEvent<HTMLSelectElement>, user: string): void {
		e.preventDefault();

		if (activity.projectId && project && !project.accessList.includes(user)) {
			console.log("Cannot add user to the activity: the user is not in the project list");
			return;
		}

		if (activity.accessList.includes(user)) {
			console.log("Cannot add user: already in the access list");
			return;
		}

		setActivity((prevAct) => {
			return {
				...prevAct,
				accessList: [...prevAct.accessList, user],
			};
		});
	}

	function deleteUser(e: React.MouseEvent<HTMLElement>, username: string): void {
		e.preventDefault();

		setActivity((prevAct) => {
			return {
				...prevAct,
				accessList: prevAct.accessList.filter((u) => u !== username),
			};
		});
	}

	function handleUpdateActivity(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();

		console.log("Updating activity: ", JSON.stringify(activity));

		fetch(`${SERVER_API}/activities/${activity.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: activity.title,
				description: activity.description,
				accessList: activity.accessList,
				deadline: new Date(activity.deadline).toISOString().split("T")[0],
				completed: activity.completed,
				completedAt: activity.completedAt,
				idEventoNotificaCondiviso: activity.idEventoNotificaCondiviso,
				projectId: activity.projectId,
				start:
					new Date(activity.start || Date.now()).toISOString().split("T")[0] || undefined,
				milestone: activity.milestone,
				parent: activity.parent,
				prev: activity.prev,
				next: activity.next,
				advancementType: activity.advancementType,
				active: activity.active,
				abandoned: activity.abandoned,
				reactivated: activity.reactivated,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					alert("Attività modificata con successo");
					refreshActivity();
					setIsEditing(false);
				} else {
					console.log(data.message || "Errore nell'aggiornamento");
					setMessage(data.message || "Errore nell'aggiornamento");
				}
			})
			.catch(() => {
				setMessage("Impossibile raggiungere il server");
			});
	}

	function handleDeleteActivity(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();

		if (!isOwner) {
			setMessage("Non sei il proprietario dell'attività");
			return;
		}

		fetch(`${SERVER_API}/activities/${activity.id}`, {
			method: "DELETE",
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					alert("Attività eliminata correttamente");
					nav("/activities");
				} else {
					console.log(data.message || "Errore durante l'eliminazione");
					setMessage(data.message || "Errore durante l'eliminazione");
				}
			})
			.catch(() => {
				setMessage("Impossibile raggiungere il server");
			});
	}

	function handleAbortChanges(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();

		refreshActivity();
		setIsEditing(false);
	}
	// On page load, get the project data
	React.useEffect(() => {
		refreshActivity();
	}, [serverTime]);

	React.useEffect(() => {
		if (activity.projectId) {
			refreshProject();
		}
	}, [serverTime, activity.projectId]);

	// share activity handlers
	// function handleAddUserToShareList(
	//     e: React.ChangeEvent<HTMLSelectElement>
	// ): void {
	//     e.preventDefault();
	//     // only one user at a time
	//     const username = e.target.value;
	//     if (!activity.accessList.includes(username)) {
	//         setShareList([username]);
	//     }
	// }

	// async function handleShareActivity(
	//     e: React.MouseEvent<HTMLButtonElement>
	// ): Promise<void> {
	//     e.preventDefault();
	//
	//     fetch(`${SERVER_API}/activities/${activity.id}/share`, {
	//         method: "POST",
	//         headers: { "Content-Type": "application/json" },
	//         body: JSON.stringify({
	//             userList: shareList,
	//             activityId: activity.id,
	//         }),
	//     })
	//         .then((res) => res.json())
	//         .then((data) => {
	//             if (data.status === ResponseStatus.GOOD) {
	//                 alert("Attività condivisa correttamente");
	//                 setShareActivity(false);
	//                 setShareList([]);
	//             } else {
	//                 console.log(
	//                     data.message || "Errore durante la condivisione"
	//                 );
	//                 setMessage(
	//                     data.message || "Errore durante la condivisione"
	//                 );
	//             }
	//         });

	// TODO: ADD NOTIFICATION IN BACKEND!!
	// TODO: ADD EVENT IN BACKEND!!
	// }

	function findParentActivity(): Activity | undefined {
		if (!project) return undefined;

		if (!activity.parent) return undefined;

		for (const act of project?.activityList) {
			const title = findActivity(act, activity.parent);
			console.log(title);
			if (title) return title;
		}

		return undefined;
	}

	function findNextActivity(): Activity | undefined {
		if (!project) return undefined;

		if (!activity.next) return undefined;

		for (const act of project?.activityList) {
			const title = findActivity(act, activity.next);
			if (title) return title;
		}

		return undefined;
	}

	function findActivity(input: Activity, id: string): Activity | undefined {
		if (input.id === id) return input;

		if (input.children)
			for (const child of input.children) {
				const title = findActivity(child, id);
				if (title) return title;
			}

		return undefined;
	}

	function findPreviousActivity(): Activity | undefined {
		if (!project) return undefined;

		for (const act of project?.activityList) {
			const title = findPrevActivity(act, activity.id || "");
			if (title) return title;
		}
		return undefined;
	}

	function findPrevActivity(input: Activity, id: string): Activity | undefined {
		if (input.next === id) return input;

		if (input.children)
			for (const child of input.children) {
				const found = findPrevActivity(child, id);
				if (found) return found;
			}

		return undefined;
	}

	return (
		<>
			<div className="activity-background">
				{!isEditing ? (
					<>
						<div className="activity-container">
							<div id="title-1" className="activity-page-title">
								Visualizza attività
								<a href="/activities" className="activity-close-link">
									X
								</a>
								{/* isOwner && (
                                    <>
                                        <label htmlFor="allDayEvent">
                                            <button
                                                name="addNotification"
                                                onClick={(): void =>
                                                    setShareActivity(
                                                        !shareActivity
                                                    )
                                                }
                                                style={{
                                                    marginLeft: "5px",
                                                    marginRight: "3px",
                                                    marginTop: "3px",
                                                }}
                                            >
                                                Condividi
                                            </button>
                                        </label>
                                        {shareActivity && (
                                            <div
                                                id="send-invite"
                                                className="send-invite-container"
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <div>
                                                    Scegli l'utente con il quale
                                                    condividere l'attività
                                                </div>

                                                <SearchForm
                                                    onItemClick={
                                                        handleAddUserToShareList
                                                    }
                                                    list={shareList}
                                                />
                                                <button
                                                    onClick={
                                                        handleShareActivity
                                                    }
                                                    className="btn btn-primary send-invite-button"
                                                    style={{
                                                        backgroundColor:
                                                            "bisque",
                                                        color: "black",
                                                        border: "0",
                                                        marginBottom: "10px",
                                                    }}
                                                >
                                                    Condividi
                                                </button>
                                            </div>
                                        )}{" "}
                                    </>
                                )*/}
							</div>

							{/* render title */}
							<div className="activity-title">
								<div>Titolo</div>
								<div>{activity.title}</div>
							</div>

							{/* render description */}
							<div className="activity-description">
								<div>Descrizione</div>
								<div>{activity.description}</div>
							</div>

							{/* render completed */}
							<div className="activity-completed">
								<div>Completa? {activity.completed ? "Si" : "No"}</div>
							</div>

							{/* render dates */}
							<div className="activity-dates">
								<div>
									Data di inizio:{" "}
									{new Date(activity.start || "").toLocaleString("it-IT", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>
							</div>
							<div className="activity-dates">
								<div>
									Da completare entro:{" "}
									{new Date(activity.deadline).toLocaleString("it-IT", {
										day: "2-digit",
										month: "2-digit",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>
							</div>

							{/* render access list */}
							<div className="activity-participants">
								<label>
									Utenti partecipanti all'attività
									<div className="activity-users-container">
										{activity.accessList.length > 0 ? (
											activity.accessList.map((u) => (
												<div className="activity-user-box">{u}</div>
											))
										) : (
											<div>Nessun partecipante</div>
										)}
									</div>
								</label>
							</div>

							{/* render project */}
							{project && activity.projectId && (
								<>
									<div className="activity-project">
										<div>
											Questa attività fa parte di un progetto:{" "}
											<a href={`/projects/${activity.projectId}`}>
												{project.title}
											</a>
										</div>
									</div>

									{/* render status */}
									<div className="activity-status">
										<div>
											Status: <b>{activity.status}</b>
										</div>
									</div>

									{/* render milestone */}
									<div className="activity-milestone">
										<div>Milestone? {activity.milestone ? "Si" : "No"}</div>
									</div>

									{/* render advancement type */}
									<div className="activity-advancementType">
										<div>Tipo di avanzamento: {activity.advancementType}</div>
									</div>

									{/* parent */}
									<div
										className="activity-parent"
										key={"activity-next" + activity.parent}>
										<div>
											Attività padre:{" "}
											{findParentActivity() ? (
												<a href={"/activities/" + findParentActivity()?.id}>
													<div>{findParentActivity()?.title}</div>
												</a>
											) : (
												<div>Nessuna</div>
											)}
										</div>
									</div>

									{/* prev */}
									<div
										className="activity-next"
										key={"activity-prev" + activity.next}>
										<div>
											Attività precedente:{" "}
											{findPreviousActivity() ? (
												<a
													href={
														"/activities/" + findPreviousActivity()?.id
													}>
													<div>{findPreviousActivity()?.title}</div>
												</a>
											) : (
												<div>Nessuna</div>
											)}
										</div>
									</div>

									{/* next */}
									<div className="activity-next">
										<div key={"activity-next" + activity.next}>
											Prossima attività:{" "}
											{findNextActivity() ? (
												<a href={"/activities/" + findNextActivity()?.id}>
													<div>{findNextActivity()?.title}</div>
												</a>
											) : (
												<div>Nessuna</div>
											)}
										</div>
									</div>

									{/* render children list */}
									<div className="activity-children">
										<label>
											Sotto-attività
											<div className="activity-children-container">
												{activity.children &&
													(activity.children.length ? (
														activity.children.map((a) => (
															<a href={"/activities/" + a.id}>
																<div>{a.title}</div>
															</a>
														))
													) : (
														<div>Nessuna sotto attività</div>
													))}
											</div>
										</label>
									</div>
								</>
							)}

							<button
								className="activity-edit-button"
								onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
									e.preventDefault();
									if (isUser || isOwner) setIsEditing(true);
									else setMessage("Non hai i permessi per modificare");
									document.getElementById("title-1")?.scrollIntoView({
										behavior: "smooth",
									});
								}}>
								Modifica
							</button>
						</div>
					</>
				) : (
					<>
						<div className="activity-container">
							{/* Render updating activity*/}
							<div id="title-2" className="activity-page-title">
								Modifica attività
								<a href="/activities" className="activity-close-link">
									X
								</a>
							</div>
							{/* render title */}
							<label className="activity-title">
								Titolo
								<input
									type="text"
									name="title"
									value={activity.title}
									onChange={handleTextChange}
									disabled={!isUser}
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
									disabled={!isUser}
								/>
							</label>

							{/* render dates */}
							{project && (
								<label
									htmlFor="start"
									className="activity-vertical"
									style={{
										display: "flex",
										flexDirection: "row",
										flexWrap: "wrap",
										alignItems: "center",
										marginBottom: "15px",
										padding: "10px",
										border: "1px solid #ddd",
										borderRadius: "8px",
										backgroundColor: "#fdfdfd",
									}}>
									Inizio
									<div
										style={{
											display: "flex",
											flexFlow: "wrap",
											alignItems: "center",
											gap: "0.5em",
										}}>
										<div>
											<DatePicker
												className="btn border"
												name="start"
												selected={activity.start || new Date(Date.now())}
												onChange={(date: Date | null): void => {
													if (date) {
														// Aggiorna la data mantenendo l'orario attuale
														const newDate = new Date(
															activity.start || ""
														);
														newDate.setFullYear(
															date.getFullYear(),
															date.getMonth(),
															date.getDate()
														);
														setActivity({
															...activity,
															start: newDate,
														});
													}
												}}
												disabled={!isUser}
											/>
										</div>
										<div>
											<input
												style={{
													backgroundColor: "white",
												}}
												disabled={!isUser}
												className="btn border"
												type="time"
												value={`${new Date(activity.start || "")
													.getHours()
													.toString()
													.padStart(2, "0")}:${new Date(
													activity.start || ""
												)
													.getMinutes()
													.toString()
													.padStart(2, "0")}`}
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>
												): void => {
													const [hours, minutes] =
														e.target.value.split(":");
													const newDate = new Date(activity.start || "");
													newDate.setHours(
														Number(hours),
														Number(minutes)
													); // Aggiorna l'orario
													setActivity({
														...activity,
														start: newDate,
													});
												}}
											/>
										</div>
									</div>
								</label>
							)}
							<label
								htmlFor="endTime"
								className="activity-vertical"
								style={{
									display: "flex",
									flexDirection: "row",
									flexWrap: "wrap",
									alignItems: "center",
									marginBottom: "15px",
									padding: "10px",
									border: "1px solid #ddd",
									borderRadius: "8px",
									backgroundColor: "#fdfdfd",
								}}>
								Scadenza
								<div
									style={{
										display: "flex",
										flexFlow: "wrap",
										alignItems: "center",
										gap: "0.5em",
									}}>
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
													setActivity({
														...activity,
														deadline: newDate,
													});
												}
											}}
											disabled={!isUser}
										/>
									</div>
									<div>
										<input
											style={{
												backgroundColor: "white",
											}}
											disabled={!isUser}
											className="btn border"
											type="time"
											value={`${new Date(activity.deadline)
												.getHours()
												.toString()
												.padStart(2, "0")}:${new Date(activity.deadline)
												.getMinutes()
												.toString()
												.padStart(2, "0")}`}
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>
											): void => {
												const [hours, minutes] = e.target.value.split(":");
												const newDate = new Date(activity.deadline);
												newDate.setHours(Number(hours), Number(minutes)); // Aggiorna l'orario
												setActivity({
													...activity,
													deadline: newDate,
												});
											}}
										/>
									</div>
								</div>
							</label>

							{/* render completed */}
							<label className="activity-completed">
								Completa?
								<input
									type="checkbox"
									name="completed"
									checked={activity.completed}
									onChange={handleCheckboxChange}
									disabled={!isUser} // only user can change completed
								/>
							</label>
							{/* render access list */}
							<div className="activity-participants">
								<label>
									Utenti partecipanti all'attività
									{isOwner && (
										<SearchForm
											onItemClick={addUser}
											list={activity.accessList}
										/>
									)}
									<div className="activity-users-container">
										{activity.accessList.length > 0 ? (
											activity.accessList.map((u) => (
												<div className="activity-user-box">
													{u}
													{isOwner && (
														<button
															style={{
																marginLeft: "0.5em",
																padding: "0",
																backgroundColor: "#d64545",
															}}
															className="activity-user-delete"
															onClick={(
																e: React.MouseEvent<HTMLButtonElement>
															): void => deleteUser(e, u)}>
															X
														</button>
													)}
												</div>
											))
										) : (
											<div>Nessun partecipante</div>
										)}
									</div>
								</label>
							</div>
							{/* render project inputs */}
							{/* render project */}
							{project && activity.projectId && (
								<>
									<div className="activity-project">
										<div>
											Questa attività fa parte di un progetto:{" "}
											<a href={`/projects/${activity.projectId}`}>
												{project.title}
											</a>
										</div>
									</div>

									{/* render status */}
									<div className="activity-status">
										<div>
											Status: <b>{getActivityStatus(serverTime, activity)}</b>
										</div>
									</div>

									{/* render start date */}
									{/* <label
										htmlFor="start"
										className="activity-vertical"
										style={{
											display: "flex",
											flexDirection: "row",
											flexWrap: "wrap",
											alignItems: "center",
											marginBottom: "15px",
											padding: "10px",
											border: "1px solid #ddd",
											borderRadius: "8px",
											backgroundColor: "#fdfdfd",
										}}>
										Data di Inizio
										<div
											style={{
												display: "flex",
												flexFlow: "wrap",
												alignItems: "center",
												gap: "0.5em",
											}}>
											<input
												type="date"
												name="start"
												value={new Date(
													activity.start || Date.now()
												).getTime()}
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>
												): void => {
													setActivity({
														...activity,
														start: new Date(e.target.value),
													});
												}}
											/>
										</div>
									</label> */}

									{/* render advancement type */}
									<div className="activity-advancementType">
										<div>
											Tipo di avanzamento:{" "}
											<select
												style={{
													backgroundColor: "white",
												}}
												className="btn border"
												name="advancementType"
												onChange={(
													e: React.ChangeEvent<HTMLSelectElement>
												): void => {
													setActivity({
														...activity,
														advancementType: e.target
															.value as AdvancementType,
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
										</div>
									</div>

									{/* parent*/}
									<div className="activity-parent">
										<div>
											Attività padre: {activity.parent || "Nessuna"} (Non
											modificabile)
										</div>
									</div>

									{/* next */}
									<div className="activity-next">
										<div>
											Prossima attività: {activity.next || "Nessuna"}
											{isOwner && (
												<>
													<select
														style={{
															backgroundColor: "white",
														}}
														className="btn border"
														name="next"
														onChange={(
															e: React.ChangeEvent<HTMLSelectElement>
														): void => {
															setActivity({
																...activity,
																next: e.target.value,
															});
														}}>
														<option value="">Nessuna</option>
														{project &&
															getPossibleNextList(
																project.activityList
															).map((act) => (
																<option
																	key={act.title}
																	value={act.id}>
																	{act.title}
																</option>
															))}
													</select>
													<a
														href={`/activities/new?projectId=${activity.projectId}&parent=${activity.id}&next=${activity.next}`}>
														<button>
															Aggiungi attività successiva
														</button>
													</a>
												</>
											)}
										</div>
									</div>

									{/* render children list */}
									<div className="activity-children">
										<label>
											Sotto-attività
											<div className="activity-children-container">
												{activity.children &&
													(activity.children.length ? (
														activity.children.map((a) => (
															<a href={"/activities/" + a.id}>
																<div>{a.title}</div>
															</a>
														))
													) : (
														<div>Nessuna sotto-attività</div>
													))}
											</div>
											{isOwner && !activity.parent && (
												<a
													href={`/activities/new?projectId=${activity.projectId}&parent=${activity.id}`}>
													<button>Aggiungi sotto-attività</button>
												</a>
											)}
										</label>
									</div>

									{/* render completed */}
									<label className="activity-completed">
										Milestone?
										<input
											type="checkbox"
											name="milestone"
											checked={activity.milestone || false}
											onChange={handleCheckboxChange}
											disabled={!isOwner} // only owner can change milestone
										/>
									</label>

									{/* Segna come attiva */}
									<label className="activity-completed">
										Attiva?
										<input
											type="checkbox"
											name="active"
											checked={activity.active || false}
											onChange={handleCheckboxChange}
											disabled={!isUser} // only user can change completed
										/>
									</label>

									{/* Segna come  */}
									<label className="activity-completed">
										Abbandonata?
										<input
											type="checkbox"
											name="abandoned"
											checked={activity.abandoned || false}
											onChange={handleCheckboxChange}
											disabled={!isUser} // only user can change abandoned
										/>
									</label>

									{/* Segna come attiva (SOLO OWNER) */}
									{isOwner && activity.status === ActivityStatus.COMPLETED && (
										<label className="activity-completed">
											Riattiva:
											<input
												type="checkbox"
												name="reactivated"
												checked={activity.reactivated || false}
												onChange={handleCheckboxChange}
											/>
										</label>
									)}
								</>
							)}
							<button
								onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
									e.preventDefault();
									handleUpdateActivity(e);
									document.getElementById("title-2")?.scrollIntoView({
										behavior: "smooth",
									});
								}}>
								Termina modifiche
							</button>
							<button
								onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
									e.preventDefault();
									handleAbortChanges(e);
									document.getElementById("title-2")?.scrollIntoView({
										behavior: "smooth",
									});
								}}
								style={{ backgroundColor: "red" }}>
								Annulla Modifiche
							</button>
							<button
								onClick={handleDeleteActivity}
								style={{ backgroundColor: "red" }}>
								Elimina Attività
							</button>
						</div>
					</>
				)}
			</div>

			{message && <div>{message}</div>}
		</>
	);
}
