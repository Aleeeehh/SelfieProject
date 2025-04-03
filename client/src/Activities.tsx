import React from "react";
import { SERVER_API } from "./lib/params";
import type { ResponseBody } from "./types/ResponseBody";
// import { useNavigate } from "react-router-dom";
import { ResponseStatus } from "./types/ResponseStatus";
import type Activity from "./types/Activity";
import type User from "./types/User";
import { Link, useNavigate } from "react-router-dom";

const PREVIEW_CHARS = 100;
const MAX_TITLE_CHARS = 17;

enum SORT {
	PROJECT = "project",
	NAME = "name",
	DEADLINE = "deadline",
	STARTDATE = "startDate",
}

export default function Activities(): React.JSX.Element {
	const [activities, setActivities] = React.useState([] as Activity[]);
	const [userFilter, setUserFilter] = React.useState("");
	const [projectFilter, setProjectFilter] = React.useState("");
	const [sortFilter, setSortFilter] = React.useState<SORT>(SORT.PROJECT);

	const [users, setUsers] = React.useState<string[]>([]);
	const [usernameToId, setUsernameToId] = React.useState<{ [key: string]: string }>({});

	const [projectTitles, setProjectTitles] = React.useState<string[]>([]);
	const [projectIdToTitle, setProjectIdToTitle] = React.useState<{ [key: string]: string }>({});

	const [confirmDelete, setConfirmDelete] = React.useState(false);
	const [currentDate, setCurrentDate] = React.useState<Date | null>(null);
	const [activityToDelete, setActivityToDelete] = React.useState<string | null>(null);

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



	const userId = localStorage.getItem("loggedUserId");

	const nav = useNavigate();


	async function getUsernameById(userId: string): Promise<string> {
		try {
			const res = await fetch(`${SERVER_API}/users/getUsernameById?userId=${userId}`);
			const data = await res.json();
			return data.username;
		} catch (e) {
			console.log("Impossibile recuperare l'username dell'utente");
			return userId; // fallback all'ID in caso di errore
		}
	}

	// Aggiungi questa nuova funzione
	async function getProjectTitleById(projectId: string): Promise<string> {
		try {
			const res = await fetch(`${SERVER_API}/projects/${projectId}`);
			const data = await res.json();
			return data.value.title;
		} catch (e) {
			console.log("Impossibile recuperare il titolo del progetto");
			return projectId; // fallback all'ID in caso di errore
		}
	}
	React.useEffect(() => {
		fetchCurrentDate();

		//aggiorna la currentDate di calendar ogni secondo
		const intervalId = setInterval(fetchCurrentDate, 1000);
		return () => clearInterval(intervalId);
	}, []);

	async function handleCompleteActivity(id: string): Promise<void> {
		console.log("Completo l'attività:", id);
		const res = await fetch(`${SERVER_API}/activities/completeActivity`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				activity_id: id,
			}),
		});

		const resTitle = await fetch(`${SERVER_API}/activities/title/${id}`);
		const dataTitle = await resTitle.json();
		const activityTitle = dataTitle.value;
		console.log("TITOLO ATTIVITA COMPLETATA:", activityTitle);

		//ottieni tutte le note con l'id dell'attività completata
		const resNotes = await fetch(`${SERVER_API}/notes/`);
		const dataNotes = await resNotes.json();
		const Notes = dataNotes.value;
		console.log("ATTIVITA COMPLETATA:", activityTitle);
		//per ogni nota, scorri la sua todoList, e controlla se ci sono item il cui item.text sia
		//uguale ad activity.title
		console.log("Queste sono le note su cui iterare:", Notes);

		for (const note of Notes) {
			console.log("Questi sono gli item della nota:", note.toDoList);
			for (const item of note.toDoList) {
				if (item.text === activityTitle) {
					console.log("ITEM DA COMPLETARE:", item);

					const noteId = note._id || note.id;
					console.log("ID NOTA:", noteId);

					// Chiamata alla nuova API per completare l'item
					const res = await fetch(
						`${SERVER_API}/notes/${noteId}/complete-item/${item.id}`,
						{
							method: "PUT",
							headers: { "Content-Type": "application/json" },
						}
					);

					if (!res.ok) {
						console.error("Errore nel completamento dell'item");
					} else {
						console.log("Item completato con successo");
					}
				}
			}
		}

		const data = await res.json();
		//console.log("ATTIVITA COMPLETATA:", data);

		//const res2 = await fetch(`${SERVER_API}/activities`); // Assicurati che l'endpoint sia corretto
		//const updatedActivities = await res2.json();

		const owner = await getCurrentUser();
		const ownerId = owner.value._id.toString();
		const res3 = await fetch(`${SERVER_API}/notifications/user/${ownerId}`);
		const data3 = await res3.json();
		const attivitaCompletata = data.value[0];
		console.log("ATTIVITA COMPLETATA:", attivitaCompletata);
		const notifications = data3.value; //tutte le notifiche sul database
		console.log("NOTIFICHE RIMASTE IN LISTAAAA:", notifications);
		console.log("Attività completataAAAA:", attivitaCompletata);
		const idEventoNotificaCondiviso = attivitaCompletata.idEventoNotificaCondiviso;
		console.log("ID CONDIVISO ATTIVITA COMPLETATA:", idEventoNotificaCondiviso);
		//console.log("NOTIFICHE ATTUALIIII:", notifications);

		for (const notification of notifications) {
			const res3 = await fetch(`${SERVER_API}/notifications/deleteNotification`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					notification_id: notification.id,
					idEventoNotificaCondiviso: idEventoNotificaCondiviso,
				}), // Assicurati di usare il campo corretto
			});
			console.log("ID NOTIFICA DA ELIMINARE:", notification.id);

			if (!res3.ok) {
				const errorData = await res3.json();
				console.error("Errore durante l'eliminazione della notifica:", errorData);
			} else {
				console.log(
					`Notifica con ID ${notification.data.idEventoNotificaCondiviso} eliminata con successo.`
				);
			}
		}

		await updateActivities();
	}

	async function getAllUsers(): Promise<string[]> {
		const users: string[] = [];
		const mapping: { [key: string]: string } = {};
		const userPromises: Promise<void>[] = [];

		activities.forEach((act) => {
			act.accessList.forEach((userId) => {
				if (!users.includes(userId)) {
					userPromises.push(
						getUsernameById(userId).then(username => {
							if (!users.includes(username)) {
								users.push(username);
								mapping[username] = userId; // Salva la mappatura username -> ID
							}
						})
					);
				}
			});
		});

		await Promise.all(userPromises);
		setUsernameToId(mapping); // Salva la mappatura nello state
		return users;
	}
	// Aggiungi questo useEffect
	React.useEffect(() => {
		getAllProjects().then(setProjectTitles);
	}, [activities]);

	async function getAllProjects(): Promise<string[]> {
		const titles: string[] = [];
		const mapping: { [key: string]: string } = {};
		const projectPromises: Promise<void>[] = [];

		activities.forEach((act) => {
			// Verifica che projectId sia una stringa valida
			if (act.projectId && typeof act.projectId === 'string' && !mapping[act.projectId]) {
				projectPromises.push(
					getProjectTitleById(act.projectId).then(title => {
						if (!titles.includes(title)) {
							titles.push(title);
							mapping[act.projectId as string] = title; // Type assertion
						}
					})
				);
			}
		});

		await Promise.all(projectPromises);
		setProjectIdToTitle(mapping);
		return titles;
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

	async function updateActivities(): Promise<void> {
		try {
			const currentUser = await getCurrentUser();
			if (!currentUser) {
				nav("/login");
				return;
			}
			const userId = currentUser.value._id.toString();

			const res = await fetch(`${SERVER_API}/activities/owner?owner=${userId}`);
			const data = await res.json();
			console.log("ID utente corrente:", userId);
			if (data.status === ResponseStatus.GOOD) {
				const activities = data.value;
				console.log("Attività trovate:", activities);
				setActivities(activities as Activity[]);
				console.log("Attività da mostrare:", activities);
			} else {
				console.log(data.message || "Errore nel caricamento delle attività");
			}
		} catch (error) {
			console.log("Impossibile raggiungere il server");
		}
	}

	// On page load, get the activities for the user
	React.useEffect(() => {
		updateActivities();
	}, []);

	React.useEffect(() => {
		getAllUsers().then(setUsers);
	}, [activities]);

	/*async function handleDelete(
		e: React.MouseEvent<HTMLButtonElement>,
		id: string | undefined
	): Promise<void> {
		e.preventDefault();
		console.log("ID ATTIVITA DA ELIMINARE:", id);
		console.log("ID ATTIVITA DA ELIMINARE:", id);
		console.log("ID ATTIVITA DA ELIMINARE:", id);
		console.log("ID ATTIVITA DA ELIMINARE:", id);
		console.log("ID ATTIVITA DA ELIMINARE:", id);
		console.log("ID ATTIVITA DA ELIMINARE:", id);



		if (!id) {
			alert(
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
				setActivities(prev => prev.filter(activity => (activity as any)._id !== id));
				updateActivities();
			} else {
				alert(resBody.message || "Errore nel cancellamento dell'attività");
			}
		} catch (e) {
			console.log("Impossibile raggiungere il server");
		}
	}*/


	async function handleDelete(id: string): Promise<void> {
		if (!id) {
			alert("Errore nel cancellamento dell'attività: ID non trovato.");
			return;
		}

		//ottengo i dati dell'attività da eliminare
		const res1 = await fetch(`${SERVER_API}/activities/${id}`, {
			method: "GET",
			headers: { "Content-Type": "application/json" }
		});
		const data1 = await res1.json();
		const attivitaEliminata = data1.value;
		console.log("ATTIVITA DA ELIMINARE:", attivitaEliminata);
		console.log("ATTIVITA DA ELIMINARE:", attivitaEliminata);
		console.log("ATTIVITA DA ELIMINARE:", attivitaEliminata);
		console.log("ATTIVITA DA ELIMINARE:", attivitaEliminata);
		console.log("ATTIVITA DA ELIMINARE:", attivitaEliminata);
		console.log("ATTIVITA DA ELIMINARE:", attivitaEliminata);
		console.log("ATTIVITA DA ELIMINARE:", attivitaEliminata);
		console.log("ATTIVITA DA ELIMINARE:", attivitaEliminata);

		try {


			/*
				//cerca l'evento scadenza dell'attività ed eliminalo
				const res2 = await fetch(`${SERVER_API}/events/deleteEventTitle`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						titoloDaEliminare: "Scadenza " + attivitaEliminata[0].title,
					}),
				});
				const data2 = await res2.json();
				console.log("Evento scadenza eliminato:", data2);
		
		
		
		
				//notifiche dell'attività da eliminare
				const owner = await getCurrentUser();
				const ownerId = owner.value._id.toString();
				const res3 = await fetch(`${SERVER_API}/notifications/user/${ownerId}`);
				const data3 = await res3.json();
				const notifications = data3.value; //tutte le notifiche sul database
		
				const idEventoNotificaCondiviso = attivitaEliminata[0].idEventoNotificaCondiviso;
		
				for (const notification of notifications) {
					const res3 = await fetch(`${SERVER_API}/notifications/deleteNotification`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							notification_id: notification.id,
							idEventoNotificaCondiviso: idEventoNotificaCondiviso,
						}), // Assicurati di usare il campo corretto
					});
					console.log("ID NOTIFICA DA ELIMINARE:", notification.id);
		
					if (!res3.ok) {
						const errorData = await res3.json();
						console.error("Errore durante l'eliminazione della notifica:", errorData);
					} else {
						console.log(
							`Notifica con ID ${notification.data.idEventoNotificaCondiviso} eliminata con successo.`
						);
					}
				}
				*/

			//elimina l'attività
			const res = await fetch(`${SERVER_API}/activities/${id}`, {
				method: "DELETE",
			});

			const resBody = (await res.json()) as ResponseBody;

			if (res.status === 200) {
				console.log("Attività eliminata correttamente!");
				setActivities((prev) => prev.filter((activity) => (activity as any)._id !== id)); // Aggiorna lo stato rimuovendo l'attività eliminata
				setConfirmDelete(false); // Chiudi il popup
				setActivityToDelete(null); // Resetta l'attività selezionata
			} else {
				alert(resBody.message || "Errore nel cancellamento dell'attività.");
			}
		} catch (e) {
			console.log("Impossibile raggiungere il server.");
		}

		console.log("ATTIVITA DA ELIMINARE:", attivitaEliminata);


		//cerca l'evento scadenza dell'attività ed eliminalo
		const res2 = await fetch(`${SERVER_API}/events/deleteEventTitle`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				titoloDaEliminare: "Scadenza " + attivitaEliminata.title,
			}),
		});
		const data2 = await res2.json();
		console.log("Evento scadenza eliminato:", data2);
		console.log("Evento scadenza eliminato:", data2);
		console.log("Evento scadenza eliminato:", data2);
		console.log("Evento scadenza eliminato:", data2);




		//notifiche dell'attività da eliminare
		const owner = await getCurrentUser();
		const ownerId = owner.value._id.toString();
		const res3 = await fetch(`${SERVER_API}/notifications/user/${ownerId}`);
		const data3 = await res3.json();
		const notifications = data3.value; //tutte le notifiche sul database

		const idEventoNotificaCondiviso = attivitaEliminata.idEventoNotificaCondiviso;

		for (const notification of notifications) {
			const res3 = await fetch(`${SERVER_API}/notifications/deleteNotification`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					notification_id: notification.id,
					idEventoNotificaCondiviso: idEventoNotificaCondiviso,
				}), // Assicurati di usare il campo corretto
			});
			console.log("ID NOTIFICA DA ELIMINARE:", notification.id);

			if (!res3.ok) {
				const errorData = await res3.json();
				console.error("Errore durante l'eliminazione della notifica:", errorData);
			} else {
				console.log(
					`Notifica con ID ${notification.data.idEventoNotificaCondiviso} eliminata con successo.`
				);
			}
		}
	}




	return (
		<>
			<div className="activities-container">
				<a href={`/activities/new`} style={{ marginTop: "1em" }}>
					<button>Crea nuova attività</button>
				</a>

				<div className="sort-label-container">
					<div className="sort-label">
						<div style={{ color: "black" }}>Filtra per progetto:</div>
						<select
							className="sort-select"
							onChange={(e): void => {
								const selectedTitle = e.target.value;
								if (selectedTitle === "") {
									setProjectFilter("");
								} else if (selectedTitle === "no-project") {
									setProjectFilter("no-project");
								} else {
									// Trova l'ID del progetto corrispondente al titolo selezionato
									const projectId = Object.keys(projectIdToTitle).find(
										key => projectIdToTitle[key] === selectedTitle
									) || "";
									setProjectFilter(projectId);
								}
							}}
							value={
								projectFilter === ""
									? ""
									: projectFilter === "no-project"
										? "no-project"
										: projectIdToTitle[projectFilter] || ""
							}
						>
							<option value="">Tutti</option>
							<option value="no-project">Senza progetto</option>
							{projectTitles.map((title) => (
								<option key={title} value={title}>{title}</option>
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
							}}
						>
							<option value="">Tutti</option>
							{users.map((user) => (
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
							}}
						>
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
							return act.accessList.includes(usernameToId[userFilter]);
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
							<Link to={`/activities/${(activity as any)._id}`} style={{ textDecoration: "none" }}>								<div className="card-activity" key={activity.id} style={{ cursor: "pointer" }}>
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
								<div className="card-activity-title" style={{ backgroundColor: "rgb(238, 234, 228)" }}>
									<h6>
										{/* scritta in verde se completata, in rosso se in ritardo*/}
										<span style={{ color: "rgb(88, 205, 103)", fontWeight: "bold" }}>{activity.completed ? "ATTIVITA' COMPLETATA!" : ""}</span>
										<span style={{ color: "lightcoral", fontWeight: "bold" }}>{!activity.completed && currentDate && new Date(activity.deadline) < currentDate ? "ATTIVITA' IN RITARDO!" : ""}</span>

									</h6>
								</div>
								<div className="card-activity-buttons">

									<button
										onClick={async (e: React.MouseEvent): Promise<void> => {
											e.preventDefault();
											await handleCompleteActivity(
												(activity as any)._id
											); //completo l'attività corrente
										}}
									>
										Completa
									</button>
									{activity.owner === userId && (
										<button
											style={{ backgroundColor: "#ff6b6b" }}
											onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
												e.preventDefault();
												setConfirmDelete(true); // Mostra il popup di conferma
												setActivityToDelete((activity as any)._id); // Imposta l'attività selezionata per l'eliminazione
											}}
										>
											Cancella
										</button>
									)}
								</div>
								<div className="confirmDelete-background"
									style={{ display: confirmDelete ? "flex" : "none" }}
								>
									<div className="confirmDelete-container">
										<h2>Stai eliminando una attività. Vuoi procedere?</h2>
										<div
											style={{ display: "flex", gap: "2em" }}
										>
											<button
												style={{ backgroundColor: "#ff6b6b" }}
												onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
													e.preventDefault();
													setConfirmDelete(false); // Chiudi il popup
													setActivityToDelete(null); // Resetta l'attività selezionata
												}}
											>
												Annulla
											</button>
											<button
												onClick={async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
													e.preventDefault();
													if (activityToDelete) {
														await handleDelete(activityToDelete);
														setActivityToDelete(null);
														setConfirmDelete(false);
													}
												}}
											>
												Continua
											</button>
										</div>
									</div>
								</div>
							</div>
							</Link>
						))

						/*.map((activity) => (
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
									<button
										onClick={(): void =>
											window.location.assign(`/activities/${(activity as any)._id}`)
										}
									>
										Visualizza
									</button>
									{activity.owner === userId && (
										<button
											style={{ backgroundColor: "#ff6b6b" }}
											onClick={async (
												e: React.MouseEvent<HTMLButtonElement>
											): Promise<void> => {
												console.log("attività da eliminare: ", activity);
												console.log("attività da eliminare: ", activity);
												handleDelete(e, (activity as any)._id);
											}}
										>
											Cancella
										</button>
									)}
								</div>
							</div>
						))*/












					}
				</div>
			</div>
		</>
	);
}
