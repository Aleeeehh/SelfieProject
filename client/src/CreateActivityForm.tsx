//import React, { useEffect } from "react";
import { SERVER_API } from "./lib/params";
import { ResponseStatus } from "./types/ResponseStatus";
import { useLocation, useNavigate } from "react-router-dom";
import type Activity from "./types/Activity";
import { AdvancementType } from "./types/Activity";
import type Project from "./types/Project";
import SearchForm from "./SearchForm";
import type User from "./types/User";
import React from "react";
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
	deadline: new Date(),
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
	const [addNotification, setAddNotification] = React.useState(false);
	const [notificationRepeat, setNotificationRepeat] = React.useState(false);
	const [notificationTime, setNotificationTime] = React.useState(0);
	const [notificationRepeatTime, setNotificationRepeatTime] = React.useState(0);
	const [currentDate, setCurrentDate] = React.useState(new Date());


	const getValidRepeatOptions = (time: number): number[] => {
		const options = [0, 5, 10, 15, 30, 60, 120, 1440]; // Opzioni disponibili
		return options.filter((option) => option !== time && (time % option === 0 || option === 0)); // Filtra solo i divisori, escludendo il numero stesso
	};


	function toggleAddNotification(): void {
		setAddNotification(!addNotification);
		if (notificationRepeat === true) {
			setNotificationRepeat(false);
		}
	}

	const fetchCurrentDate = async (): Promise<void> => {
		try {
			const response = await fetch(`${SERVER_API}/currentDate`);
			if (!response.ok) {
				throw new Error("Errore nel recupero della data corrente");
			}
			const data = await response.json();
			setCurrentDate(new Date(data.currentDate)); // Assicurati che il formato sia corretto

		} catch (error) {
			console.error("Errore durante il recupero della data corrente:", error);
		}
	};

	React.useEffect(() => {
		fetchCurrentDate();
	}, []);

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
				console.log("Impossibile raggiungere il server");
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

	async function getCurrentUser(): Promise<Promise<any> | null> {
		try {
			const res = await fetch(`${SERVER_API}/users`);
			if (!res.ok) {
				// Controlla se la risposta non è ok
				console.log("Utente non autenticato");
				return null; // Restituisci null se non autenticato
			}
			//console.log("Questa è la risposta alla GET per ottenere lo user", res);
			const data: User = await res.json();
			//console.log("Questo è il json della risposta", data);
			return data;
		} catch (e) {
			console.log("Impossibile recuperare l'utente corrente");
			return null;
		}
	}

	async function handleCreateActivity(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		if (activity.title === "") {
			setMessage("Inserisci un titolo valido");
			return;
		}
		if (activity.description === "") {
			setMessage("Inserisci una descrizione valida");
			return;
		}
		if (!activity.deadline || isNaN(activity.deadline.getTime())) {

			setMessage("Inserisci una scadenza valida");
			return;
		}



		console.log("Creating activity: ", JSON.stringify(activity));

		console.log("AccessList: ", activity.accessList);
		//converti tutti gli username degli utenti dell'accessList in id
		let accessListIds: string[] = [];
		for (const user of activity.accessList) {
			const res = await fetch(`${SERVER_API}/users/getIdByUsername?username=${user}`);
			const data = await res.json();
			accessListIds.push(data.id);
		}
		console.log("AccessListIds: ", accessListIds);

		const currentUser = await getCurrentUser();
		const owner = currentUser?.value._id.toString();
		accessListIds = [...new Set([...accessListIds, owner])];


		let accessListAccepted: string[] = [];
		accessListAccepted.push(owner);
		//se non si msotra projectid, usa start come parametro per distinzione attività di progetto e attività normale

		const idEventoNotificaCondiviso = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

		console.log("deadline: ", activity.deadline);
		console.log("deadline: ", activity.deadline);

		console.log("deadline: ", activity.deadline);

		console.log("deadline: ", activity.deadline);
		console.log("deadline: ", activity.deadline);
		console.log("deadline: ", activity.deadline);

		console.log("deadline: ", activity.deadline);

		console.log("deadline: ", activity.deadline);


		//crea l'attività come evento sul calendario
		const res = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				idEventoNotificaCondiviso,
				owner,
				title: "Scadenza " + activity.title,
				startTime: new Date(activity.deadline.getTime() - 60 * 60 * 1000).toISOString(),
				endTime: activity.deadline.toISOString(),
				untilDate: null,
				isInfinite: false,
				frequency: "once",
				location: "",
				repetitions: 1,
			}),
		});

		const newEvent = {
			idEventoNotificaCondiviso,
			owner,
			title: "Scadenza " + activity.title,
			startTime: new Date(activity.deadline.getTime() - 60 * 60 * 1000).toISOString(),
			endTime: activity.deadline.toISOString(),
			untilDate: null,
			isInfinite: false,
			frequency: "once",
			location: "",
			repetitions: 1,
		};
		console.log("Evento scadenza creato:", res);

		fetch(`${SERVER_API}/activities/${activity.id}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: activity.title,
				description: activity.description,
				accessList: accessListIds,
				accessListAccepted: accessListAccepted,
				deadline: new Date(activity.deadline).toISOString(),
				idEventoNotificaCondiviso: idEventoNotificaCondiviso,

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
					console.log("Attività creata con successo");
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

		var notificationDate = new Date(newEvent.startTime);
		console.log("notificationDate: ", notificationDate);
		console.log("notificationDate: ", notificationDate);
		console.log("notificationDate: ", notificationDate);
		console.log("notificationDate: ", notificationDate);
		console.log("notificationDate: ", notificationDate);
		notificationDate.setHours(notificationDate.getHours() + 1); // 
		notificationDate.setMinutes(notificationDate.getMinutes() - notificationTime);
		console.log("Questa è la data di inizio evento:", activity.deadline);
		console.log("Questa è la data della notifica:", notificationDate);
		var message = "";
		if (notificationTime < 60) {
			message = "Scadenza " + activity.title + " tra " + notificationTime + " minuti!";
		} else {
			message = "Scadenza " + activity.title + " tra " + notificationTime / 60 + " ore!";
		}

		if (notificationTime == 0) {
			message = "Scadenza " + activity.title + " iniziata!";
		}

		var repeatTime = notificationRepeatTime;
		var repeatedNotification = false;
		if (repeatTime > 0) {
			repeatedNotification = true;
		}

		//se è stata annessa una notifica all'evento, aggiungo tale notifica al db con una post
		if (addNotification) {
			console.log(
				"Aggiungo notifica di lunghezza ",
				notificationTime,
				" minuti prima per l'attività ",
				activity.title
			);
			console.log("creo notifia con data: ", activity.deadline.toISOString());
			console.log("creo notifia con repeat: ", repeatedNotification);
			console.log("creo notifia con repeatTime: ", repeatTime);
			console.log("creo notifia con notificationTime: ", notificationTime);
			const res3 = await fetch(`${SERVER_API}/notifications`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: message,
					mode: "activity",
					receiver: owner, // Cambia il receiver per ogni membro della accessList
					type: "activity",
					data: {
						date: notificationDate, // data prima notifica
						idEventoNotificaCondiviso: idEventoNotificaCondiviso, // id condiviso con l'evento, per delete di entrambi
						repeatedNotification: repeatedNotification, // se è true, la notifica si ripete
						repeatTime: repeatTime, // ogni quanti minuti si ripete la notifica, in seguito alla data di prima notifica
						firstNotificationTime: notificationTime, // quanto tempo prima della data di inizio evento si invia la prima notifica
					},
				}),
			});
			console.log("Notifica creata per: " + owner, "Risposta:", res3);
			console.log("")
		}

		//invia ad ogni utente della accessList una richiesta di accettazione dell'attività (una notifica)
		for (const receiver of activity.accessList) {
			const newNotification = {
				message: message,
				mode: "activity",
				receiver: receiver,
				type: "activity",
				data: {
					date: activity.deadline.toISOString(),
					idEventoNotificaCondiviso: idEventoNotificaCondiviso,
					firstNotificationTime: notificationTime,
					repeatedNotification: repeatedNotification,
					repeatTime: repeatTime,
					activity: activity,
					event: newEvent,
				},
			};

			if (receiver !== owner) {
				console.log("Questo è il receiver:", receiver);
				const res4 = await fetch(`${SERVER_API}/notifications`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						message: "Hai ricevuto un attività condivisa",
						mode: "activity",
						receiver: receiver, // Cambia il receiver per ogni membro della accessList
						type: "shareActivity",
						data: {
							date: activity.deadline.toISOString(), // data prima notifica
							idEventoNotificaCondiviso: idEventoNotificaCondiviso, // id condiviso con l'evento, per delete di entrambi
							firstNotificationTime: notificationTime, // quanto tempo prima della data di inizio evento si invia la prima notifica
							activity: activity, //attività condivisa
							event: newEvent, //evento scadenza dell'attività condivisa
							notification: addNotification ? newNotification : null,
						},
					}),
				});
				console.log("Notifica creata per:", receiver, "Risposta:", res4);
			}
		}


		if (projectId) { //se l'attività è legata ad un progetto, invia notifiche "project activity" agli utenti dell'attività

			console.log("Creo le notifiche per gli utenti");
			console.log("AccessList: ", activity.accessList);
			//invia ad ogni utente della accessList una richiesta di accettazione dell'attività (una notifica)
			for (const receiver of activity.accessList) {
				const res = await fetch(`${SERVER_API}/users/getIdByUsername?username=${receiver}`);
				const data = await res.json();
				const receiverId = data.id;

				const newEvent = {
					idEventoNotificaCondiviso,
					owner: receiverId,
					title: "Scadenza " + activity.title,
					startTime: new Date(activity.deadline.getTime() - 60 * 60 * 1000).toISOString(),
					endTime: activity.deadline.toISOString(),
					untilDate: null,
					isInfinite: false,
					frequency: "once",
					location: "",
					repetitions: 1,
				};


				if (receiver !== activity.owner) { //posso mettere che la riceva anche l'owner magari
					console.log("Questo è il receiver:", receiver);
					const res4 = await fetch(`${SERVER_API}/notifications`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							message: "Hai ricevuto un invito per un'attività di un progetto",
							mode: "activity",
							receiver: receiverId, // Cambia il receiver per ogni membro della accessList
							type: "ProjectActivity",
							data: {
								date: currentDate, // data prima notifica
								activity: activity,
								event: newEvent,
							},
						}),
					});
					console.log("Notifica creata per:", receiver, "Risposta:", res4);
				}
			}
		}

		//se projectId è null, manda notifiche "activity" agli utenti dell'attività
		if (!projectId) {
			for (const receiver of activity.accessList) {
				const res = await fetch(`${SERVER_API}/users/getIdByUsername?username=${receiver}`);
				const data = await res.json();
				const receiverId = data.id;

				const newEvent = {
					idEventoNotificaCondiviso,
					owner: receiverId,
					title: "Scadenza " + activity.title,
					startTime: new Date(activity.deadline.getTime() - 60 * 60 * 1000).toISOString(),
					endTime: activity.deadline.toISOString(),
					untilDate: null,
					isInfinite: false,
					frequency: "once",
					location: "",
					repetitions: 1,
				};

				if (receiver !== activity.owner) {



					console.log("Questo è il receiver:", receiver);
					const res4 = await fetch(`${SERVER_API}/notifications`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							message: "Hai ricevuto un attività condivisa",
							mode: "activity",
							receiver: receiverId, // Cambia il receiver per ogni membro della accessList
							type: "shareActivity",
							data: {
								date: activity.deadline.toISOString(), // data prima notifica
								idEventoNotificaCondiviso: idEventoNotificaCondiviso, // id condiviso con l'evento, per delete di entrambi
								activity: activity, //attività condivisa
								event: newEvent, //evento scadenza dell'attività condivisa
								notification: null,
							},
						}),
					});
					console.log("Notifica creata per:", receiver, "Risposta:", res4);
				}
			}
		}
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

	React.useEffect(() => {
		const handleEscKey = (event: KeyboardEvent): void => {
			if (event.key === 'Escape') {
				window.location.href = '/activities';
			}
		};

		window.addEventListener('keydown', handleEscKey);

		return () => {
			window.removeEventListener('keydown', handleEscKey);
		};
	}, []);

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
					Crea una nuova attività
					<a
						href="/activities"
						className="activity-close-link"
					>
						X
					</a>
				</div>

				{/* render title */}
				<label className="activity-title">
					Titolo
					<input
						type="text"
						name="title"
						placeholder="Titolo attività.."
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
						placeholder="Descrizione attività.."
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
					}}
				>
					Scadenza
					<div
						style={{
							display: "flex",
							flexFlow: "wrap",
							alignItems: "center",
							gap: "0.5em",
						}}
					>
						<input
							type="date"
							name="deadline"
							className="activity-date-input"
							onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
								const newDate = new Date(e.target.value);
								// Mantieni l'orario esistente
								newDate.setHours(activity.deadline.getHours());
								newDate.setMinutes(activity.deadline.getMinutes());
								setActivity({
									...activity,
									deadline: newDate,
								});
							}}
						/>

						<input
							className="btn border"
							type="time"
							defaultValue={`${activity.deadline ?
								`${activity.deadline.getHours().toString().padStart(2, "0")}:${activity.deadline.getMinutes().toString().padStart(2, "0")}`
								: "00:00"}`}
							onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
								const [hours, minutes] = e.target.value.split(":");
								const newDate = new Date(activity.deadline || new Date()); // Fallback a new Date() se deadline è null
								newDate.setHours(Number(hours), Number(minutes));
								setActivity({
									...activity,
									deadline: newDate,
								});
							}}
							onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
								if (e.key === "Backspace") {
									e.preventDefault();
								}
							}}
						/>
					</div>
				</label>


				{/* 
				<label htmlFor="allDayEvent">
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

				{false && (
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
				)}
*/}
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

				<label htmlFor="addNotificationActivity"
					style={{
						cursor: 'pointer',
						userSelect: 'none',  // Impedisce la selezione del testo
						WebkitUserSelect: 'none',  // Per Safari
						MozUserSelect: 'none',     // Per Firefox
						msUserSelect: 'none'       // Per IE/Edge
					}}>
					<input
						type="checkbox"
						name="addNotificationActivity"
						id="addNotificationActivity"
						onClick={toggleAddNotification}
						style={{
							marginLeft: "5px",
							marginRight: "3px",
							marginTop: "3px",
							cursor: "pointer",
						}}
					/>
					Aggiungi notifica scadenza
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
							}}>
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
				)}

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
							}}
						>
							Data di Inizio
							<div
								style={{
									display: "flex",
									flexFlow: "wrap",
									alignItems: "center",
									gap: "0.5em",
								}}
							>
								<input
									type="date"
									name="start"
									className="activity-date-input"
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
									value={activity.advancementType || undefined}
								>
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
						<label className="activity-completed" htmlFor="milestone">
							Milestone?
							<input
								type="checkbox"
								name="milestone"
								id="milestone"
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
				{message && <div className="error-message">{message}</div>}
				<button
					style={{ backgroundColor: "rgb(249, 205, 140)", color: "white" }}
					onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
						e.preventDefault();
						handleCreateActivity(e);
					}}
				>
					Crea attività
				</button>
			</div>
		</div>
	);
}
