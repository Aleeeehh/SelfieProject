import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseStatus } from "./types/ResponseStatus";
import { useLocation, useNavigate } from "react-router-dom";
import type Activity from "./types/Activity";
import { AdvancementType } from "./types/Activity";
import type Project from "./types/Project";
import SearchForm from "./SearchForm";

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
const emptyActivity: Activity = {
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
	status: null,
	milestone: false,
	advancementType: AdvancementType.TRANSLATION,
	parent: null,
	active: false,
	reactivated: false,
	abandoned: false,
	// start: new Date("2024-11-10T00:00:00.000Z"),
	children: [],
};

export default function CreateActivityForm(): React.JSX.Element {
	const location = useLocation();
	const projectId = new URLSearchParams(location.search).get("projectId");
	const parent = new URLSearchParams(location.search).get("parent");
	const next = new URLSearchParams(location.search).get("next");

	const nav = useNavigate();
	const [message, setMessage] = React.useState("");
	const [activity, setActivity] = React.useState<Activity>(emptyActivity);
	const [project, setProject] = React.useState<Project | null>(null);
	// const [addNotification, setAddNotification] = React.useState(false);
	// const [notificationRepeat, setNotificationRepeat] = React.useState(false);
	// const [_, setNotificationRepeatTime] = React.useState(0);
	// const [notificationTime, setNotificationTime] = React.useState(0);

	function refreshProject(): void {
		fetch(`${SERVER_API}/projects/${projectId}`)
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

	function addUser(e: React.ChangeEvent<HTMLSelectElement>, user: string): void {
		e.preventDefault();

		// if there is a project, the second condition has to check if
		// the project allows the user to be added

		if (projectId && project && !project.accessList.includes(user)) {
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

	function handleCreateActivity(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();

		console.log("Creating activity: ", JSON.stringify(activity));

		fetch(`${SERVER_API}/activities/${activity.id}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: activity.title,
				description: activity.description,
				accessList: activity.accessList,
				deadline: new Date(activity.deadline).toISOString().split("T")[0],
				idEventoNotificaCondiviso: activity.idEventoNotificaCondiviso,

				// project related fields
				projectId: projectId,
				milestone: activity.milestone,
				parent: parent,
				next: next,
				advancementType: activity.advancementType,
				start: activity.start?.toISOString().split("T")[0] || undefined,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					alert("Attività creata con successo");
					if (projectId) nav(`/projects/${projectId}`);
					else nav(`/activities/${data.value}`);
				} else {
					console.log(data.message || "Errore nell'aggiornamento");
					setMessage(data.message || "Errore nell'aggiornamento");
				}
			})
			.catch(() => {
				setMessage("Impossibile raggiungere il server");
			});
	}

	// On page load, get the project data
	React.useEffect(() => {
		refreshProject();
	}, []);

	React.useEffect(() => {
		if (activity.projectId) {
			refreshProject();
		}
	}, [activity.projectId]);

	// const getValidRepeatOptions = (time: number): number[] => {
	//     const options = [0, 5, 10, 15, 30, 60, 120, 1440]; // Opzioni disponibili
	//     return options.filter(
	//         (option) => option !== time && (time % option === 0 || option === 0)
	//     ); // Filtra solo i divisori, escludendo il numero stesso
	// };

	return (
		<div className="activity-background">
			<div className="activity-container">
				{/* Render updating activity*/}
				<div id="title-2" className="activity-page-title">
					Crea attività
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

				{/* render dates */}
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
						<input
							type="date"
							name="deadline"
							onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
								setActivity({
									...activity,
									deadline: new Date(e.target.value),
								});
							}}
						/>
						{/*<div>
							<DatePicker
								className="btn border"
								name="endTime"
								selected={activity.deadline || new Date()}
								onChange={(date: Date | null): void => {
									if (date) {
										// Aggiorna la data mantenendo l'orario attuale
										const newDate = new Date(activity.deadline) || new Date();
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
						</div>*/}
					</div>
				</label>

				{/* render notification */}
				{/* <label htmlFor="allDayEvent">
                    <input
                        type="checkbox"
                        onClick={(): void =>
                            setAddNotification(!addNotification)
                        }
                        style={{
                            marginLeft: "5px",
                            marginRight: "3px",
                            marginTop: "3px",
                        }}
                    />
                    Aggiungi notifica
                </label>

                {addNotification && (
                    <label htmlFor="notificationTime">
                        Quanto tempo prima mandare la notifica
                        <select
                            id="notificationTimeSelect"
                            className="btn border"
                            onChange={(
                                e: React.ChangeEvent<HTMLSelectElement>
                            ): void => {
                                setNotificationTime(Number(e.target.value));
                                if (Number(e.target.value) > 0) {
                                    setNotificationRepeat(true); // Imposta il valore selezionato come notificationTime
                                } else if (Number(e.target.value) == 0) {
                                    setNotificationRepeat(false);
                                }
                            }}
                            style={{ marginLeft: "10px" }} // Aggiungi margine se necessario
                        >
                            <option value="0">All'ora d'inizio</option>
                            <option value="5">5 minuti prima</option>
                            <option value="10">10 minuti prima</option>
                            <option value="15">15 minuti prima</option>
                            <option value="30">30 minuti prima</option>
                            <option value="60">1 ora prima</option>
                            <option value="120">2 ore prima</option>
                            <option value="1440">Un giorno prima</option>
                            <option value="2880">2 giorni prima</option>
                        </select>
                    </label>
                )}

                {notificationRepeat && (
                    <label htmlFor="notificationRepeatTime">
                        Quanto tempo ripetere la notifica
                        <select
                            className="btn border"
                            name="notificationRepeatTime"
                            onChange={(
                                e: React.ChangeEvent<HTMLSelectElement>
                            ): void => {
                                setNotificationRepeatTime(
                                    Number(e.target.value)
                                );
                            }}
                        >
                            {getValidRepeatOptions(notificationTime).map(
                                (option) => (
                                    <option key={option} value={option}>
                                        {option === 0
                                            ? "Mai"
                                            : option >= 60
                                            ? `Ogni ${option / 60} ore` // Se option è maggiore di 60, mostra in ore
                                            : `Ogni ${option} minuti`}
                                    </option>
                                )
                            )}
                        </select>
                    </label>
                )}*/}

				{/* render access list */}
				<div className="activity-participants">
					<label>
						Invita Utenti all'attività
						<SearchForm onItemClick={addUser} list={activity.accessList} />
						<div className="activity-users-container">
							{activity.accessList.length > 0 ? (
								activity.accessList.map((u) => (
									<div className="activity-user-box">
										{u}
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
									</div>
								))
							) : (
								<div>Nessun partecipante</div>
							)}
						</div>
					</label>
				</div>

				{/* project related fields*/}
				{projectId && (
					<>
						{/* render project */}
						{project && (
							<div className="activity-project">
								<div>
									Questa attività farà parte di un progetto:{" "}
									<a href={`/projects/${projectId}`}>{project?.title}</a>
								</div>
							</div>
						)}

						{/* render start date */}
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
									onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
										setActivity({
											...activity,
											start: new Date(e.target.value),
										});
									}}
								/>
							</div>
						</label>

						{/* advancement type */}
						<div className="activity-advancementType">
							<div>
								Tipo di avanzamento:{" "}
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
							</div>
						</div>
						{/* milestone */}
						<label className="activity-completed">
							Milestone?
							<input
								type="checkbox"
								name="milestone"
								checked={activity.milestone || false}
								onChange={handleCheckboxChange}
							/>
						</label>
						{/* parent*/}
						<div className="activity-parent">
							<div>Attività padre: {parent || "Nessuna"} (Non modificabile)</div>
						</div>

						{/* next */}
						<div className="activity-next">
							<div>Prossima attività: {next || "Nessuna"} (Non modificabile)</div>
						</div>
					</>
				)}
				{message && <div>{message}</div>}
				<button
					onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
						e.preventDefault();
						handleCreateActivity(e);
					}}>
					Crea attività
				</button>
			</div>
		</div>
	);
}
