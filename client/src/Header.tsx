import React, { useState, useEffect } from "react";
import { SERVER_API } from "./params/params";
import { ResponseStatus } from "./types/ResponseStatus";
import Notification from "./types/Notification";
import User from "./types/User";
import "bootstrap/dist/css/bootstrap.min.css";

const buttonStyle = {
	backgroundColor: "white",
	color: "black",
	borderColor: "gray",
	margin: "3px 4px",
	padding: "4px 6px",
	width: "100px",
	alignSelf: "center",
};

//const NOTIFICATION_COUNT = 5;

export default function Header(): React.JSX.Element {
	const [showTimeMachine, setShowTimeMachine] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [doNotDisturb, setDoNotDisturb] = useState(false);
	// const [noNotifications, setNoNotifications] = useState(false);
	const [notifications, setNotifications] = useState([] as Notification[]);
	const [currentDate, setCurrentDate] = useState(new Date()); // Formato YYYY-MM-DD
	const [user, setUser] = useState(null);
	const [profileImage, setProfileImage] = useState("");
	//const [isChangingDate, setIsChangingDate] = useState(false);

	const isLoggedIn = !!localStorage.getItem("loggedUserId");

	/* const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
		setCurrentDate(event.target.value);
	};*/

	function playNotificationSound(): void {
		const ring = new Audio("public/images/Notification.mp3"); // Assicurati che il percorso sia corretto
		ring.play();
	}

	const formatDate = (date: Date): string => {
		return date.toLocaleString("it-IT", {
			// Formato italiano
			day: "numeric",
			month: "numeric",
			year: "numeric",

			hour12: false, // Imposta su false per il formato 24 ore
		});
	};

	const formatDateHours = (date: Date): string => {
		return date.toLocaleString("it-IT", {
			// Formato italiano
			hour: "numeric",
			minute: "numeric",
		});
	};

	// Funzione per pulire le notifiche
	const cleanNotifications = async (): Promise<void> => {
		try {
			const res1 = await fetch(`${SERVER_API}/currentDate`);
			if (!res1.ok) {
				throw new Error("Errore nel recupero della data corrente");
			}
			// console.log("showTimeMachine:", showTimeMachine);

			// Aggiungi un secondo alla data ottenuta

			const data = await res1.json();

			const currentDate = new Date(data.currentDate);
			// const response =
			await fetch(`${SERVER_API}/notifications/cleanNotifications`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ currentDate: currentDate }), // Invia la data attuale
			});
			// console.log(response); // Log del messaggio di risposta

			/*
			 const res2 = await fetch(`${SERVER_API}/notifications`);
			 const data2 = await res2.json();
			 const notifications = data2.value;
			 console.log("NOTIFICHE RIMASTE IN LISTA:", notifications);
			 console.log("NOTIFICHE RIMASTE IN LISTA:", notifications);
			 console.log("NOTIFICHE RIMASTE IN LISTA:", notifications);
			 console.log("NOTIFICHE RIMASTE IN LISTA:", notifications);
			 console.log("NOTIFICHE RIMASTE IN LISTA:", notifications);
			 console.log("NOTIFICHE RIMASTE IN LISTA:", notifications);
			 console.log("NOTIFICHE RIMASTE IN LISTA:", notifications);
    
			 for (const notification of notifications) {
				 if (notification.isInfiniteEvent === false && notification.read === true) {
					 console.log("NOTIFICA DA ELIMINARE:", notification);
					 {
						 const res3 = await fetch(`${SERVER_API}/notifications/deleteNotification`, {
							 method: "POST",
							 headers: { "Content-Type": "application/json" },
							 body: JSON.stringify({ notification_id: notification.id, idEventoNotificaCondiviso: notification.data.idEventoNotificaCondiviso }), // Assicurati di usare il campo corretto
						 });
						 console.log("ID NOTIFICA DA ELIMINARE:", notification.id);
    
						 if (!res3.ok) {
							 const errorData = await res3.json();
							 console.error("Errore durante l'eliminazione della notifica:", errorData);
						 } else {
							 console.log(`Notifica con ID ${notification.data.idEventoNotificaCondiviso} eliminata con successo.`);
						 }
					 }
				 }
    
			 }
    
			  */
		} catch (error) {
			console.error("Errore durante la pulizia delle notifiche:", error);
		}
	};

	// useEffect che si attiva quando showNotifications cambia
	useEffect(() => {
		if (showNotifications) {
			cleanNotifications(); // Chiama la funzione per pulire le notifiche
			checkDoNotDisturb();
		}
	}, [showNotifications]); // Dipendenza da showNotifications

	const fetchCurrentDate = async (): Promise<void> => {
		try {
			const response = await fetch(`${SERVER_API}/currentDate`);
			if (!response.ok) {
				throw new Error("Errore nel recupero della data corrente");
			}
			const data = await response.json();
			// console.log("showTimeMachine:", showTimeMachine);

			// Aggiungi un secondo alla data ottenuta
			const newDate = new Date(data.currentDate);
			newDate.setSeconds(newDate.getSeconds() + 1); // Aggiungi un secondo

			// Imposta la data corrente
			setCurrentDate(newDate); // Imposta la data corrente

			// Invia la nuova data al server
			await postCurrentDate(newDate); // Invia la nuova data al server
			checkDoNotDisturb();
			fetchNotifications(); //ogni volta che modifico la data corrente, ottieni le notifiche
			hasEventNotifications(); //aggiorna il fatto che ci siano notifiche o meno di tipo event
			// console.log("NOTIFICHE:", notifications);
		} catch (error) {
			console.error("Errore durante il recupero della data corrente:", error);
		}
	};

	async function handleAddActivity(notification: Notification): Promise<void> {
		console.log(
			"EVENTO DELLA NOTIFICA DA AGGIUNGERE ALLA LISTA DEGLI EVENTI:",
			notification.data.event
		);
		console.log(
			"ATTIVITÀ DELLA NOTIFICA DA AGGIUNGERE ALLA LISTA DEGLI EVENTI:",
			notification.data.activity
		);

		const idEventoNotificaCondiviso = notification.data.event.idEventoNotificaCondiviso;
		const owner = notification.data.event.owner;
		const title = notification.data.event.title;
		const startTime = notification.data.event.startTime;
		const endTime = notification.data.event.endTime;
		const location = notification.data.event.location;

		//crea l'attività come evento sul calendario
		const res = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				idEventoNotificaCondiviso,
				owner,
				title: title,
				startTime: startTime, //TOLGO TOISOTRING
				endTime: endTime, //TOLGO TOISOTRING
				untilDate: null,
				isInfinite: false,
				frequency: "once",
				location,
				repetitions: 1,
			}),
		});
		console.log("Evento scadenza creato:", res);

		const idEventoNotificaCondiviso1 = notification.data.activity.idEventoNotificaCondiviso;
		const description1 = notification.data.activity.description;
		const title1 = notification.data.activity.title;
		const deadline1 = notification.data.activity.deadline;
		const owner1 = notification.data.activity.owner;
		const accessList1 = notification.data.activity.accessList;

		//crea l'attività come attività sul calendario
		const res2 = await fetch(`${SERVER_API}/activities`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				idEventoNotificaCondiviso: idEventoNotificaCondiviso1,
				title: title1,
				deadline: deadline1, //TOLGO TOISOTRING
				accessListAccepted: [owner1],
				description: description1,
				owner: owner1,
				accessList: accessList1,
			}),
		});
		console.log("Attività creata:", res2);

		//aggiungi la notifica dell'attività come notifica sul calendario
		if (notification.data.notification) {
			const res3 = await fetch(`${SERVER_API}/notifications`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(notification.data.notification),
			});
			console.log("Notifica creata:", res3);
		}

		//metti la notifica come letta
		handleReadNotification(notification.id);
	}

	async function handleAddSharedActivity(notification: Notification): Promise<void> {
		console.log("NOTIFICA DI ATTIVITÀ CONDIVISA:", notification);
		//aggiungi il receiver alla accessListAccepted dell'attività

		const res = await fetch(
			`${SERVER_API}/activities/${notification.data.activity.idEventoNotificaCondiviso}`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ accessListAcceptedUser: notification.receiver }),
			}
		);

		const data = await res.json();
		console.log("AccessListAccepted aggiornato:", data);

		const newEvent = notification.data.event;
		newEvent.owner = notification.receiver;

		//aggiungi al calendario l'evento scadenza dell'attività condivisa
		const response = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(newEvent),
		});
		console.log("Evento scadenza aggiunto:", response);

		//aggiungi la notifica dell'attività condivisa come notifica sul calendario
		if (notification.data.notification) {
			const res3 = await fetch(`${SERVER_API}/notifications`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(notification.data.notification),
			});
			console.log("Notifica creata:", res3);
		}

		//metti la notifica come letta
		handleReadNotification(notification.id);
	}

	async function handleAddSharedEvent(notification: Notification): Promise<void> {
		console.log("NOTIFICA DI EVENTO CONDIVISO:", notification);

		//aggiungi il receiver alla accessListAccepted dell'evento (o degli eventi)
		const res = await fetch(
			`${SERVER_API}/events/${notification.data.event.idEventoNotificaCondiviso}`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ accessListAcceptedUser: notification.receiver }),
			}
		);
		console.log("AccessListAccepted aggiornato:", res);

		//aggiungi la notifica dell'evento condiviso come notifica sul calendario
		if (notification.data.notification) {
			const res3 = await fetch(`${SERVER_API}/notifications`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(notification.data.notification),
			});
			console.log("Notifica creata:", res3);
		}
		handleReadNotification(notification.id);
	}

	async function handleAddEvent(notification: Notification): Promise<void> {
		console.log(
			"EVENTO DELLA NOTIFICA DA AGGIUNGERE ALLA LISTA DEGLI EVENTI:",
			notification.data.event
		);
		console.log(
			"ATTIVITÀ DELLA NOTIFICA DA AGGIUNGERE ALLA LISTA DEGLI EVENTI:",
			notification.data.activity
		);

		const idEventoNotificaCondiviso = notification.data.event.idEventoNotificaCondiviso;
		const owner = notification.data.event.owner;
		const title = notification.data.event.title;
		const startTime = notification.data.event.startTime;
		const endTime = notification.data.event.endTime;
		const location = notification.data.event.location;
		const isInfinite = notification.data.event.isInfinite;
		const frequency = notification.data.event.frequency;
		const untilDate = notification.data.event.untilDate;
		const repetitions = notification.data.event.repetitions;
		console.log("START TIME DELL'EVENTO DA CREARE:", startTime);
		console.log("END TIME DELL'EVENTO DA CREARE:", endTime);

		//crea l'evento sul calendario
		const res = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				idEventoNotificaCondiviso,
				owner,
				title: title,
				startTime: startTime, //TOLGO TOISOTRING
				endTime: endTime, //TOLGO TOISOTRING
				untilDate: untilDate,
				accessList: [owner],
				accessListAccepted: [owner],
				isInfinite: isInfinite,
				frequency: frequency,
				location,
				repetitions: repetitions,
			}),
		});
		console.log("Evento scadenza creato:", res);

		//aggiungi la notifica dell'attività come notifica sul calendario
		if (notification.data.notification) {
			const res3 = await fetch(`${SERVER_API}/notifications`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(notification.data.notification),
			});
			console.log("Notifica creata:", res3);
		}

		//metti la notifica come letta
		handleReadNotification(notification.id);
	}

	async function handleSnoozeNotification(notificationId: string): Promise<void> {
		try {
			const snoozeDate = new Date(currentDate.getTime() + 1000 * 60 * 60); // Aggiungi 1 ora
			const res = await fetch(`${SERVER_API}/notifications/${notificationId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ date: snoozeDate }), //posticipa la notifica di 1 ora
			});

			if (!res.ok) {
				const errorData = await res.json();
				console.error("Errore durante l'aggiornamento della notifica:", errorData);
			} else {
				console.log(`Notifica con ID ${notificationId} aggiornata con successo.`);
				// Aggiorna lo stato locale se necessario
				// Ad esempio, puoi aggiornare l'array delle notifiche per riflettere il cambiamento
			}
			cleanNotifications();
		} catch (error) {
			console.error("Errore nello snooze della notifica:", error);
		}
	}

	const handleReadNotification = async (notificationId: string): Promise<void> => {
		try {
			const res = await fetch(`${SERVER_API}/notifications/${notificationId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ read: "true" }), // Imposta il campo read a true
			});

			if (!res.ok) {
				const errorData = await res.json();
				console.error("Errore durante l'aggiornamento della notifica:", errorData);
			} else {
				console.log(`Notifica con ID ${notificationId} aggiornata con successo.`);
				// Aggiorna lo stato locale se necessario
				// Ad esempio, puoi aggiornare l'array delle notifiche per riflettere il cambiamento
			}
			cleanNotifications();
		} catch (error) {
			console.error("Errore nella richiesta:", error);
		}
	};

	async function postCurrentDate(data: Date): Promise<void> {
		try {
			//console.log(currentDate);
			// setCurrentDate(data);
			const response = await fetch(`${SERVER_API}/currentDate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ newDate: data }), // Invia la data corrente
			});

			if (!response.ok) {
				throw new Error("ERRORE NELLA RICHIESTA POST DI CURRENTDATE NELL'HEADER");
			}

			//  const data = await response.json();
			//console.log( data);

			const getResponse = await fetch(`${SERVER_API}/currentDate`);
			if (!getResponse.ok) {
				throw new Error("ERRORE NELLA RICHIESTA GET DI CURRENTDATE NELL'HEADER");
			}
		} catch (error) {
			console.error("Errore durante l'invio della data corrente:", error);
		}
	}

	//ritorna true se ci sono notifiche di tipo event che sono già passate

	function hasEventNotifications(): boolean {
		// console.log("Notifications:", notifications);
		return notifications.some((notification: Notification) => {
			if (
				notification &&
				(notification.type === "event" || notification.type === "activity") &&
				notification.read === false &&
				!notification.data.isInfiniteEvent
			) {
				// Includi anche il tipo "activity"
				const eventDate = new Date(notification.data.date); // Assicurati che notification.data.date sia un formato valido
				return eventDate < currentDate; // Controlla se la data dell'evento è inferiore a currentDate
			}
			if (notification && notification.type === "pomodoro" && notification.read === false) {
				// Includi anche il tipo "activity"
				return true;
			}

			if (notification && notification.data && notification.data.isInfiniteEvent === true) {
				const eventDate = new Date(notification.data.date);
				const currentDateSenzaOrario = new Date(
					currentDate.getFullYear(),
					currentDate.getMonth(),
					currentDate.getDate()
				);
				const eventDateSenzaOrario = new Date(
					eventDate.getFullYear(),
					eventDate.getMonth(),
					eventDate.getDate()
				);
				if (
					notification.data.frequencyEvent === "day" &&
					(currentDate.getTime() >= eventDate.getTime() ||
						(currentDate.getDate() >= eventDate.getDate() &&
							currentDate.getMonth() >= eventDate.getMonth() &&
							currentDate.getFullYear() >= eventDate.getFullYear()))
				) {
					return true;
				}

				if (
					notification.data.frequencyEvent === "week" &&
					currentDate.getDay() === eventDate.getDay() &&
					currentDateSenzaOrario >= eventDateSenzaOrario
				) {
					return true;
				}

				if (
					notification.data.frequencyEvent === "month" &&
					currentDate.getDate() === eventDate.getDate() &&
					currentDateSenzaOrario >= eventDateSenzaOrario
				) {
					return true;
				}

				if (
					notification.data.frequencyEvent === "year" &&
					currentDate.getMonth() === eventDate.getMonth() &&
					currentDate.getDate() === eventDate.getDate() &&
					currentDateSenzaOrario >= eventDateSenzaOrario
				) {
					return true;
				}
			}

			if (notification && notification.type === "message" && notification.read === false) {
				return true;
			}

			if (
				notification &&
				notification.type === "shareActivity" &&
				notification.read === false
			) {
				return true;
			}

			if (notification && notification.type === "shareEvent" && notification.read === false) {
				return true;
			}

			// Restituisci false se non è di tipo "event" o "activity"
			return false;
		});
	}

	async function getCurrentUser(): Promise<Promise<any> | null> {
		try {
			const res = await fetch(`${SERVER_API}/users`);
			if (!res.ok) {
				// Controlla se la risposta non è ok
				return null; // Restituisci null se non autenticato
			}
			//console.log("Questa è la risposta alla GET per ottenere lo user", res);
			const data: User = await res.json();
			//console.log("Questo è il json della risposta", data);
			return data;
		} catch (e) {
			return null;
		}
	}

	const fetchNotifications = async (): Promise<void> => {
		try {
			const currentUser = await getCurrentUser();
			const user = currentUser.value._id.toString();

			const response = await fetch(`${SERVER_API}/notifications/user/${user}`);

			const data = await response.json();

			// console.log("Notifications:", data);
			if (data.status === ResponseStatus.GOOD) {
				setNotifications(data.value);
			} else {
				console.error("Error:", data.message);
			}
		} catch (error) {
			console.error("Fetch error:", error);
		}
	};

	//ottengo tutti gli eventi, e guardo se la currentDate cade in un evento di tipo "NON DISTURBARE". Se si, ritorna true.
	const checkDoNotDisturb = async (): Promise<void> => {
		// console.log("ENTRO ED EFFETTUO LA CHECKDONOTDISTURB");
		const currentUser = await getCurrentUser();
		const owner = currentUser.value._id.toString();
		try {
			const res = await fetch(`${SERVER_API}/events/owner?owner=${owner}`);
			const eventi = await res.json();
			// console.log("eventi:", eventi);
			// console.log("Questi sono gli eventi trovati nell'header:", eventi);
			const eventiValue = eventi.value;
			console.log("eventiValue:", eventiValue);

			if (!eventiValue) {
				throw new Error("eventiValue non è definito");
			}

			for (const evento of eventiValue) {
				//console.log("Questo è l'evento di un iterazione:", evento);
				if (evento.title === "Non disturbare") {
					const startTime = new Date(evento.startTime);
					const endTime = new Date(evento.endTime);
					//console.log("Questa è la currentDate:", currentDate);
					//console.log("Questo è l'orario di inizio:", startTime);
					//console.log("Questo è l'orario di fine:", endTime);
					if (currentDate >= startTime && currentDate <= endTime) {
						//console.log("Trovato evento doNotDisturb che concorre con la currentDate");
						setDoNotDisturb(true); //trovato evento non disturbare, non ricevere inviti eventi/attività finchè è true
						return;
					}
				}
			}
		} catch (e) {
			console.error("Errore nel ritrovare eventi dell'utente", e);
			setDoNotDisturb(false);
		}
		//se non trova l'evento non disturbare, allora non disturbare è false
		setDoNotDisturb(false);
	};

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			await postCurrentDate(currentDate); // invia la data corrente al server
			const currentUser = await getCurrentUser();

			setUser(currentUser.value._id.toString());
			setProfileImage(currentUser.value.profileImage);

			// PINNA - BGN
			// Imposta data del server
			/* try {
				const response = await fetch(`${SERVER_API}/currentDate`);
				if (!response.ok) {
					throw new Error("Errore nel recupero della data corrente");
				}
				const data = await response.json();
				// console.log("showTimeMachine:", showTimeMachine);

				// Aggiungi un secondo alla data ottenuta
				const newDate = new Date(data.currentDate);
				newDate.setSeconds(newDate.getSeconds() + 1); // Aggiungi un secondo

				// Imposta la data corrente
				setCurrentDate(newDate); // Imposta la data corrente
			} catch (error) {
				console.error("Errore durante il recupero della data corrente:", error);
			} */
			// PINNA - END

			/*
						console.log("ID USER ATTUALE:", user); // Usa currentUser.value.id direttamente
						console.log("Questo è il currentUser.value:", currentUser.value);
						*/
		};

		fetchData(); // Chiama la funzione asincrona
	}, []);

	useEffect(() => {
		fetchNotifications(); // Fetch delle notifiche
		checkDoNotDisturb();

		// Aggiorna la currentDate della Home ogni secondo
		const intervalId = setInterval(() => {
			if (!showTimeMachine) {
				fetchCurrentDate(); // Chiama la funzione per ottenere la data corrente solo se non stai usando il time machine
			}
		}, 1000);

		return () => clearInterval(intervalId); // Pulizia dell'intervallo al momento dello smontaggio
	}, [showTimeMachine]); // Aggiungi showTimeMachine come dipendenza

	//guarda se ci sono notifiche al caricamento del componente
	useEffect(() => {
		fetchNotifications();
		checkDoNotDisturb();
	}, []);

	function toggleDropdown(): void {
		setShowDropdown((prevState) => !prevState);
		console.log("showDropdown:", showDropdown);
	}

	return (
		<header className="header-container">
			{/*Parte sinistra dell'header*/}
			<div className="link-container">
				<a href="/">
					<img src="/images/logo.jpeg" alt="logo.jpeg" title="Home" />
				</a>

				<a
					className="btn secondary"
					style={buttonStyle}
					href="/calendar"
					title="Calendario">
					Calendario
				</a>
				<a className="btn secondary" style={buttonStyle} href="/pomodoro" title="Pomodoro">
					Pomodoro
				</a>
				<a className="btn secondary" style={buttonStyle} href="/notes" title="Note">
					Note
				</a>
				<a className="btn secondary" style={buttonStyle} href="/projects" title="Progetti">
					Progetti
				</a>
				{/*
				<a
					className="btn secondary"
					style={buttonStyle}
					href="/activities"
					title="Attività"
				>
					Attività
				</a>
				*/}
			</div>

			<div className="dropdown-container">
				<a href="/">
					<img src="/images/logo.jpeg" alt="logo.jpeg" title="Home" />
				</a>
				<button
					type="button"
					className="btn secondary"
					style={{
						...buttonStyle,
						width: "80px",
						position: "relative",
					}}
					onClick={toggleDropdown}>
					Menù
					<ul
						className="dropdown-menu"
						style={{
							display: showDropdown ? "block" : "none",
							position: "absolute",
							top: "100%",
							left: "0",
							backgroundColor: "white",
							border: "1px solid #ccc",
							borderRadius: "4px",
							boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
							listStyle: "none",
							padding: "0",
							margin: "0",
							width: "120px",
							zIndex: "100",
						}}>
						<li>
							<a href="/calendar" title="Calendario">
								Calendario
							</a>
						</li>
						<li>
							<a href="/pomodoro" title="Pomodoro">
								Pomodoro
							</a>
						</li>
						<li>
							<a href="/notes" title="Note">
								Note
							</a>
						</li>
						<li>
							<a href="/projects" title="Progetti">
								Progetti
							</a>
						</li>
						<li>
							<a href="/activities" title="Attività">
								Attività
							</a>
						</li>
					</ul>
				</button>
			</div>

			{isLoggedIn ? (
				<div
					style={{
						display: "flex",
						justifyContent: "flex-end",
						width: "50%",
						alignItems: "center",
					}}>
					{currentDate && (
						<>
							<span className="btn secondary date-button">
								{formatDate(currentDate)}
							</span>
							<span className="btn secondary date-button">
								{formatDateHours(currentDate)}
							</span>
						</>
					)}

					<button
						className="btn secondary"
						title="Time Machine"
						style={{ ...buttonStyle, width: "45px" }}
						onClick={(): void => setShowTimeMachine(!showTimeMachine)}>
						<i className="fas fa-hourglass"></i>
						{/* Icona della clessidra */}
					</button>

					{showTimeMachine && (
						<>
							<div className="time-machine-form">
								<label htmlFor="dateInput">
									Cambia la data odierna:
									<input
										type="date"
										id="dateInput"
										value={
											currentDate
												? currentDate.toISOString().split("T")[0]
												: ""
										} // Assicurati che currentDate sia valido
										onChange={(event): void => {
											const inputDate = event.target.value;
											const parsedDate = new Date(inputDate);

											// Controlla se la data è valida
											if (isNaN(parsedDate.getTime())) {
												console.error("Data non valida:", inputDate);
												return; // Non procedere se la data non è valida
											}

											setCurrentDate(parsedDate); // Aggiorna lo stato solo se la data è valida
										}}
										style={{ marginLeft: "10px" }}
									/>
								</label>

								<label htmlFor="timeInput">
									Cambia l'orario:
									<input
										className="btn secondary"
										type="time"
										id="timeInput"
										value={
											currentDate
												? currentDate
														.toTimeString()
														.split(" ")[0]
														.slice(0, 5)
												: ""
										} // Imposta l'orario attuale come valore predefinito
										onChange={(event): void => {
											const timeValue = event.target.value;

											// Controlla se il valore è vuoto
											if (timeValue) {
												const timeParts = timeValue.split(":");
												const newDate = new Date(currentDate);
												newDate.setHours(
													Number(timeParts[0]),
													Number(timeParts[1])
												);
												setCurrentDate(newDate); // Aggiorna lo stato con la nuova data e orario
											} else {
												// Se il valore è vuoto, non fare nulla o gestisci come preferisci
												console.warn("Orario non valido");
											}
										}}
										style={{ marginLeft: "10px" }}
									/>
								</label>

								<button
									className="btn secondary"
									onClick={(): void => {
										postCurrentDate(currentDate); // Chiama postCurrentDate con la data e orario selezionati
										setShowTimeMachine(false); // Nascondi il time machine
										// window.location.reload();
									}}
									style={buttonStyle}>
									Imposta Data
								</button>

								<button
									className="btn secondary"
									onClick={async (): Promise<void> => {
										const newDate = new Date(); // Ottieni la data corrente
										await postCurrentDate(newDate); // Chiama postCurrentDate con la data corrente
										setCurrentDate(newDate); // Aggiorna lo stato con la nuova data
										setShowTimeMachine(false); // Nascondi il time machine
										// window.location.reload();
									}}
									style={buttonStyle}>
									Resetta Data
								</button>
							</div>
						</>
					)}

					<button
						className="btn secondary"
						title="Notifiche"
						style={{
							...buttonStyle,
							position: "relative", // Posizionamento relativo per il pallino
							width: "45px",
						}}
						onClick={(): void => {
							setShowNotifications(!showNotifications);
							playNotificationSound();
						}}>
						<i className="fas fa-bell" />
						{hasEventNotifications() &&
							!doNotDisturb && ( // Mostra il pallino solo se ci sono notifiche di tipo "event"
								<span className="notification-dot" />
							)}
						{hasEventNotifications() &&
							doNotDisturb && ( // Mostra il pallino grigio se sei in modalità non disturbare
								<span className="notification-dot-gray" />
							)}
					</button>
					{showNotifications && (
						<>
							<div
								style={{
									position: "absolute",
									top: "60px",
									right: "40px",
									backgroundColor: "white",
									border: "1px solid gray",
									padding: "10px",
									zIndex: "1",
									borderRadius: "10px",
								}}>
								{doNotDisturb && (
									<div>
										Sei in modalità{" "}
										<span
											style={{
												fontWeight: "bold",
												color: "gray",
											}}>
											non disturbare
										</span>
									</div>
								)}
								{notifications && notifications.length > 0 ? (
									notifications.map((notification, index) => {
										console.log("NOTIFICHE ATTUALI:", notifications);
										// TODO: Differentiate by type
										if (
											notification.type ===
											"pomodoro" /*&& notification.receiver === user*/
										) {
											const nCycles = notification.data.cycles || 5;
											const nStudyTime = notification.data.studyTime || 25;
											const nPauseTime = notification.data.pauseTime || 5;

											return (
												<>
													<div
														key={index} // Sposta la chiave qui
														style={{
															color: "black",
															textDecoration: "none",
														}} // Imposta il colore del testo a nero e rimuovi la sottolineatura
													>
														Hai ricevuto un invito per un{" "}
														<span
															style={{
																color: "lightcoral",
															}}>
															pomodoro
														</span>
														!
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleReadNotification(
																		notification.id
																	);
																	window.location.href = `/pomodoro?cycles=${nCycles}&studyTime=${nStudyTime}&pauseTime=${nPauseTime}`;
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-check"
																style={{
																	color: "green",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di tick */}
														</button>
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleReadNotification(
																		notification.id
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-times"
																style={{
																	color: "red",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di tick */}
														</button>
													</div>
												</>
											);
										} else if (
											notification.type === "event" &&
											notification.data.isInfiniteEvent === false &&
											notification.receiver === user &&
											notification.read === false
										) {
											console.log("ENTRO NELL'IF DELLA NOTIFICA TYPE EVENT:");

											const eventDate = new Date(notification.data.date); // Crea un oggetto Date

											//mostra la notifica solo se la data corrente è successiva alla data della notifica
											if (eventDate < currentDate) {
												return (
													<div key={index}>
														{notification.message}
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleReadNotification(
																		notification.id
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-check"
																style={{
																	color: "green",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di tick */}
														</button>
													</div>
												);
											}
										} else if (
											notification.type === "activity" &&
											notification.receiver === user &&
											notification.read === false
										) {
											const eventDate = new Date(notification.data.date); // Crea un oggetto Date

											//mostra la notifica solo se la data corrente è successiva alla data della notifica
											if (eventDate < currentDate) {
												return (
													<div key={index}>
														{notification.message}
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleReadNotification(
																		notification.id
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-check"
																style={{
																	color: "green",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di tick */}
														</button>
													</div>
												);
											}
										} else if (
											notification.data.isInfiniteEvent === true &&
											notification.receiver === user
										) {
											console.log("ENTRO NELL'IF DELLA NOTIFICA INFINITA:");

											const eventDate = new Date(notification.data.date); // Crea un oggetto Date

											const currentDateSenzaOrario = new Date(
												currentDate.getFullYear(),
												currentDate.getMonth(),
												currentDate.getDate()
											);
											const eventDateSenzaOrario = new Date(
												eventDate.getFullYear(),
												eventDate.getMonth(),
												eventDate.getDate()
											);
											//console.log("CURRENT DATE SENZA ORARIO:", currentDateSenzaOrario);
											//console.log("EVENT DATE SENZA ORARIO:", eventDateSenzaOrario);

											if (
												notification.data.frequencyEvent === "day" &&
												(currentDate.getTime() >= eventDate.getTime() ||
													(currentDate.getDate() >= eventDate.getDate() &&
														currentDate.getMonth() >=
															eventDate.getMonth() &&
														currentDate.getFullYear() >=
															eventDate.getFullYear()))
											) {
												return (
													<div key={index}>
														Evento{" "}
														<span style={{ color: "lightblue" }}>
															infinito
														</span>{" "}
														in data corrente, alle ore{" "}
														<span style={{ fontWeight: "bold" }}>
															{String(eventDate.getHours()).padStart(
																2,
																"0"
															)}
															:
															{String(
																eventDate.getMinutes()
															).padStart(2, "0")}
														</span>
														!{" "}
													</div>
												);
											}

											if (
												notification.data.frequencyEvent === "week" &&
												currentDate.getDay() === eventDate.getDay() &&
												currentDateSenzaOrario >= eventDateSenzaOrario
											) {
												return (
													<div key={index}>
														Evento{" "}
														<span
															style={{
																color: "lightblue",
															}}>
															infinito
														</span>{" "}
														in data corrente, alle ore{" "}
														<span
															style={{
																fontWeight: "bold",
															}}>
															{String(eventDate.getHours()).padStart(
																2,
																"0"
															)}
															:
															{String(
																eventDate.getMinutes()
															).padStart(2, "0")}
														</span>
														!{" "}
													</div>
												);
											}

											if (
												notification.data.frequencyEvent === "month" &&
												currentDate.getDate() === eventDate.getDate() &&
												currentDateSenzaOrario >= eventDateSenzaOrario
											) {
												return (
													<div key={index}>
														Evento{" "}
														<span
															style={{
																color: "lightblue",
															}}>
															infinito
														</span>{" "}
														in data corrente, alle ore{" "}
														<span
															style={{
																fontWeight: "bold",
															}}>
															{String(eventDate.getHours()).padStart(
																2,
																"0"
															)}
															:
															{String(
																eventDate.getMinutes()
															).padStart(2, "0")}
														</span>
														!{" "}
													</div>
												);
											}

											if (
												notification.data.frequencyEvent === "year" &&
												currentDate.getMonth() === eventDate.getMonth() &&
												currentDate.getDate() === eventDate.getDate() &&
												currentDateSenzaOrario >= eventDateSenzaOrario
											) {
												return (
													<div key={index}>
														Evento{" "}
														<span style={{ color: "lightblue" }}>
															infinito
														</span>{" "}
														in data corrente, alle ore{" "}
														<span style={{ fontWeight: "bold" }}>
															{String(eventDate.getHours()).padStart(
																2,
																"0"
															)}
															:
															{String(
																eventDate.getMinutes()
															).padStart(2, "0")}
														</span>
														!{" "}
													</div>
												);
											}
										} else if (
											notification.type === "message" &&
											notification.data.activity &&
											notification.receiver === user &&
											notification.read === false &&
											doNotDisturb === false
										) {
											const eventDate = new Date(notification.data.date); // Crea un oggetto Date
											if (eventDate < currentDate) {
												return (
													<div key={index}>
														Hai ricevuto un invito per un'{" "}
														<span
															style={{
																color: "orange",
																fontWeight: "bold",
															}}>
															attività
														</span>
														!
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleAddActivity(notification);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-check"
																style={{
																	color: "green",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di tick */}
														</button>
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleReadNotification(
																		notification.id
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-times"
																style={{
																	color: "red",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di elimazione */}
														</button>
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleSnoozeNotification(
																		notification.id
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-arrows-alt-h"
																style={{
																	color: "lightblue",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di elimazione */}
														</button>
													</div>
												);
											}
										} else if (
											notification.type === "message" &&
											!notification.data.activity &&
											notification.receiver === user &&
											notification.read === false &&
											doNotDisturb === false
										) {
											const eventDate = new Date(notification.data.date); // Crea un oggetto Date
											if (eventDate < currentDate) {
												return (
													<div key={index}>
														Hai ricevuto un invito per un{" "}
														<span
															style={{
																color: "bisque",
																fontWeight: "bold",
															}}>
															evento
														</span>
														!
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleAddEvent(notification);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-check"
																style={{
																	color: "green",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di tick */}
														</button>
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleReadNotification(
																		notification.id
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-times"
																style={{
																	color: "red",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di elimazione */}
														</button>
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleSnoozeNotification(
																		notification.id
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-arrows-alt-h"
																style={{
																	color: "lightblue",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di elimazione */}
														</button>
													</div>
												);
											}
										} else if (
											notification.type === "shareActivity" &&
											notification.receiver === user &&
											notification.read === false &&
											doNotDisturb === false
										) {
											console.log("Notifica trovata: :", notification);
											console.log("Notifica trovata: :", notification);

											console.log("Notifica trovata: :", notification);

											console.log("Notifica trovata: :", notification);

											console.log("Notifica trovata: :", notification);

											const eventDate = new Date(notification.data.date); // Crea un oggetto Date
											if (eventDate < currentDate) {
												return (
													<div key={index}>
														Hai ricevuto un invito per un'{" "}
														<span
															style={{
																color: "orange",
																fontWeight: "bold",
															}}>
															attività condivisa
														</span>
														!
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleAddSharedActivity(
																		notification
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-check"
																style={{
																	color: "green",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di tick */}
														</button>
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleReadNotification(
																		notification.id
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-times"
																style={{
																	color: "red",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di elimazione */}
														</button>
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleSnoozeNotification(
																		notification.id
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-arrows-alt-h"
																style={{
																	color: "lightblue",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di elimazione */}
														</button>
													</div>
												);
											}
										} else if (
											notification.type === "shareEvent" &&
											notification.receiver === user &&
											notification.read === false &&
											doNotDisturb === false
										) {
											const eventDate = new Date(notification.data.date); // Crea un oggetto Date
											if (eventDate < currentDate) {
												return (
													<div key={index}>
														Hai ricevuto un invito per un{" "}
														<span
															style={{
																color: "bisque",
																fontWeight: "bold",
															}}>
															evento condiviso
														</span>
														!
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleAddSharedEvent(
																		notification
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-check"
																style={{
																	color: "green",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di tick */}
														</button>
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleReadNotification(
																		notification.id
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-times"
																style={{
																	color: "red",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di elimazione */}
														</button>
														<button
															className="btn secondary"
															style={{
																background: "none",
																cursor: "pointer",
															}}
															onClick={(): void => {
																if (notification.id) {
																	// Controlla se notification.id è definito
																	handleSnoozeNotification(
																		notification.id
																	);
																} else {
																	console.error(
																		"ID notifica non definito"
																	);
																}
															}}>
															<i
																className="fas fa-arrows-alt-h"
																style={{
																	color: "lightblue",
																	fontSize: "20px",
																}}></i>{" "}
															{/* Icona di elimazione */}
														</button>
													</div>
												);
											}
										}

										return null;
									})
								) : (
									<div>
										<p style={{ fontWeight: "bold" }}>Non ci sono notifiche</p>
									</div>
								)}
							</div>
						</>
					)}
					<div
						style={{
							...buttonStyle,
							display: "flex",
							width: undefined,
							justifyContent: "flex-end",
							alignItems: "center",
						}}>
						<a
							href="/profile"
							title="Profilo"
							style={{
								width: "40px",
								height: "40px",
								borderRadius: "50%",
								backgroundColor: "#007bff",
								border: "none",
								cursor: "pointer",
								alignItems: "center",
								display: "flex",
								justifyContent: "center",
							}}>
							<img
								src={
									profileImage
										? `/images/profile/${profileImage}`
										: "/images/avatar.png"
								}
								alt="Avatar"
								style={{
									width: "40px",
									height: "40px",
									borderRadius: "50%",
									objectFit: "cover",
								}}
							/>
						</a>
					</div>
				</div>
			) : (
				<a
					href="/login"
					title="Login"
					className="btn secondary"
					style={{
						...buttonStyle,
						backgroundColor: "green",
						color: "white",
					}}>
					Login
				</a>
			)}
		</header>
	);
}
