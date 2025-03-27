import React, { useState, useEffect } from "react";
import { SERVER_API } from "./lib/params";
import { ResponseStatus } from "./types/ResponseStatus";
import Notification from "./types/Notification";
import User from "./types/User";
import "bootstrap/dist/css/bootstrap.min.css";
import { useRefresh } from "./TimeContext";
//import { useRef } from "react";

const buttonStyle = {
	backgroundColor: "white",
	color: "black",
	margin: "3px 4px",
	padding: "4px 6px",
	width: "100px",
	alignSelf: "center",
};

export default function Header(): React.JSX.Element {
	/*
	const [overlayOpacity, setOverlayOpacity] = useState(0);
	const [overlayText, setOverlayText] = useState<string>("");
	const [showOverlay, setShowOverlay] = useState<boolean>(false);
	*/
	const [showTimeMachine, setShowTimeMachine] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [doNotDisturb, setDoNotDisturb] = useState(false);
	const [notifications, setNotifications] = useState([] as Notification[]);
	const [currentDate, setCurrentDate] = useState(new Date());
	const [isDateLoaded, setIsDateLoaded] = useState(true);
	const [user, setUser] = useState(null);
	const [username, setUsername] = useState("");
	const [profileImage, setProfileImage] = useState(() => {
		// Prova a recuperare l'immagine dal localStorage al caricamento iniziale
		return localStorage.getItem('profileImage') || '';
	});	//const previousNotificationsRef = useRef(notifications);


	const isLoggedIn = !!localStorage.getItem("loggedUserId");

	// async function refreshCurrentDate(): Promise<void> {
	// 	const response = await fetch(`${SERVER_API}/currentDate`);
	// 	if (!response.ok) {
	// 		throw new Error("Errore nel recupero della data corrente");
	// 	}
	// 	const data = await response.json();
	// 	setCurrentDate(new Date(data.currentDate));
	// }

	const { triggerAction } = useRefresh();

	function playNotificationSound(): void {
		const ring = new Audio("public/images/Notification.mp3");
		ring.play();
	}

	useEffect(() => {
		if (profileImage) {
			localStorage.setItem('profileImage', profileImage);
		}
	}, [profileImage]);

	const formatDate = (date: Date): string => {
		return date.toLocaleString("it-IT", {
			day: "numeric",
			month: "numeric",
			year: "numeric",

			hour12: false,
		});
	};

	const formatDateHours = (date: Date): string => {
		return date.toLocaleString("it-IT", {
			hour: "numeric",
			minute: "numeric",
		});
	};

	const cleanNotifications = async (): Promise<void> => {
		try {
			// const res1 = await fetch(`${SERVER_API}/currentDate`);
			// if (!res1.ok) {
			// 	throw new Error("Errore nel recupero della data corrente");
			// }

			// const data = await res1.json();

			// const currentDate = new Date(data.currentDate);
			await fetch(`${SERVER_API}/notifications/cleanNotifications`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ currentDate: currentDate }),
			});
		} catch (error) {
			console.error("Errore durante la pulizia delle notifiche:", error);
		}
	};

	useEffect(() => {
		if (showNotifications) {
			cleanNotifications();
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

			const newDate = new Date(data.currentDate);
			newDate.setSeconds(newDate.getSeconds() + 1);
			setCurrentDate(newDate);
			triggerAction();

			await postCurrentDate(newDate);
			checkDoNotDisturb();
			fetchNotifications(); // Ogni volta che modifico la data corrente, ottieni le notifiche
			hasEventNotifications(); // Aggiorna il fatto che ci siano notifiche o meno di tipo event
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

		// Crea l'attività come evento sul calendario
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

		// Crea l'attività come attività sul calendario
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

		// Aggiungi la notifica dell'attività come notifica sul calendario
		if (notification.data.notification) {
			const res3 = await fetch(`${SERVER_API}/notifications`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(notification.data.notification),
			});
			console.log("Notifica creata:", res3);
		}

		// Metti la notifica come letta
		handleReadNotification(notification.id);
	}

	async function handleAddSharedActivity(notification: Notification): Promise<void> {
		console.log("NOTIFICA DI ATTIVITÀ CONDIVISA:", notification);
		// Aggiungi il receiver alla accessListAccepted dell'attività

		const res = await fetch(
			`${SERVER_API}/activities/${notification.data.idEventoNotificaCondiviso}`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ accessListAcceptedUser: notification.receiver }),
			}
		);

		const data = await res.json();
		console.log("AccessListAccepted aggiornato:", data);

		const newEvent = notification.data.event;
		//newEvent.owner = notification.receiver;
		console.log("Evento scadenza da aggiungere al calendario:", newEvent);

		// Aggiungi al calendario l'evento scadenza dell'attività condivisa
		const response = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(newEvent),
		});
		console.log("Evento scadenza aggiunto:", response);
		const data2 = await response.json();
		console.log("Data dell'evento scadenza aggiunto:", data2);

		// Aggiungi la notifica dell'attività condivisa come notifica sul calendario
		if (notification.data.notification) {
			const res3 = await fetch(`${SERVER_API}/notifications`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(notification.data.notification),
			});
			console.log("Notifica creata:", res3);
		}

		// Metti la notifica come letta
		handleReadNotification(notification.id);
	}

	async function handleAddProject(notification: Notification): Promise<void> {
		console.log("NOTIFICA DI PROGETTO:", notification);
		let project;
		// Ottieni il progetto dal titolo
		console.log("titolo progetto notifica:", notification.data.project.title);
		const res = await fetch(
			`${SERVER_API}/projects/by-title/${notification.data.project.title}`
		);
		if (res.ok) {
			const data = await res.json();
			project = data.value;
			console.log("Progetto trovato:", project);
		}
		// Una volta ottenuto il progetto, aggiungi l'utente attuale alla accessListAccepted
		console.log("ID PROGETTO:", project.id);
		const res2 = await fetch(`${SERVER_API}/projects/${project.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ accessListAcceptedUser: notification.receiver }),
		});

		console.log("AccessListAccepted aggiornato:", res2);
		handleReadNotification(notification.id);
	}

	async function handleAddProjectActivity(notification: Notification): Promise<void> {
		//const owner = await getCurrentUser();
		//const ownerId = owner.value._id.toString();
		// Ottieni l'attività dal titolo
		const res = await fetch(
			`${SERVER_API}/activities/by-title/${notification.data.activity.title}`
		);
		const data = await res.json();
		const activity = data.value;
		console.log("Attività trovata:", activity);
		console.log("ID ATTIVITÀ:", activity._id);

		// Aggiungi l'utente corrente all'accessListAccepted dell'attività
		const res2 = await fetch(`${SERVER_API}/activities/${activity._id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ accessListAcceptedUser: notification.receiver }),
		});
		console.log("AccessListAccepted aggiornato:", res2);

		// Crea evento scadenza per l'attivitò del progetto, nel calendario dell'utente
		// Crea l'attività come evento sul calendario
		const endTime = new Date(activity.deadline);

		const startTime = new Date(endTime);
		startTime.setHours(endTime.getHours() - 1);

		const newEvent = notification.data.event;
		//newEvent.owner = notification.receiver;
		console.log("Evento scadenza da aggiungere al calendario:", newEvent);

		// Aggiungi al calendario l'evento scadenza dell'attività condivisa
		const response = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(newEvent),
		});
		console.log("Evento scadenza creato:", response);

		handleReadNotification(notification.id);
	}

	async function handleAddSharedEvent(notification: Notification): Promise<void> {
		console.log("NOTIFICA DI EVENTO CONDIVISO:", notification);

		// Aggiungi il receiver alla accessListAccepted dell'evento (o degli eventi)
		const res = await fetch(
			`${SERVER_API}/events/${notification.data.event.idEventoNotificaCondiviso}`,
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ accessListAcceptedUser: notification.receiver }),
			}
		);
		console.log("AccessListAccepted aggiornato:", res);

		// Aggiungi la notifica dell'evento condiviso come notifica sul calendario
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

		// Crea l'evento sul calendario
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

		// Aggiungi la notifica dell'attività come notifica sul calendario
		if (notification.data.notification) {
			const res3 = await fetch(`${SERVER_API}/notifications`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(notification.data.notification),
			});
			console.log("Notifica creata:", res3);
		}

		// Metti la notifica come letta
		handleReadNotification(notification.id);
	}

	async function handleSnoozeNotification(notificationId: string): Promise<void> {
		try {
			const snoozeDate = new Date(currentDate.getTime() + 1000 * 60 * 60); // +1 ora
			const res = await fetch(`${SERVER_API}/notifications/${notificationId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ date: snoozeDate }), // Posticipa la notifica di 1 ora
			});

			if (!res.ok) {
				const errorData = await res.json();
				console.error("Errore durante l'aggiornamento della notifica:", errorData);
			} else {
				console.log(`Notifica con ID ${notificationId} aggiornata con successo.`);
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
				body: JSON.stringify({ read: "true" }),
			});

			if (!res.ok) {
				const errorData = await res.json();
				console.error("Errore durante l'aggiornamento della notifica:", errorData);
			} else {
				console.log(`Notifica con ID ${notificationId} aggiornata con successo.`);
			}
			cleanNotifications();
		} catch (error) {
			console.error("Errore nella richiesta:", error);
		}
	};

	async function postCurrentDate(data: Date): Promise<void> {
		try {
			const response = await fetch(`${SERVER_API}/currentDate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ newDate: data }),
			});

			if (!response.ok) {
				throw new Error("ERRORE NELLA RICHIESTA POST DI CURRENTDATE NELL'HEADER");
			}

			setCurrentDate(data);
			localStorage.setItem('currentDate', data.toISOString());
		} catch (error) {
			console.error("Errore durante l'invio della data corrente:", error);
		}
	}

	useEffect(() => {
		if (hasEventNotifications() && !doNotDisturb) {
			setShowNotifications(true);
		}
	}, [notifications, doNotDisturb]);

	useEffect(() => {
		if (doNotDisturb) {
			setShowNotifications(false);
		}
	}, [doNotDisturb]);

	// Ritorna true se ci sono notifiche di tipo event che sono già passate
	function hasEventNotifications(): boolean {
		return notifications.some((notification: Notification) => {
			if (
				notification &&
				(notification.type === "event" || notification.type === "activity") &&
				notification.read === false &&
				!notification.data.isInfiniteEvent
			) {
				const eventDate = new Date(notification.data.date);
				return eventDate < currentDate;
			}
			if (notification && notification.type === "pomodoro" && notification.read === false) {
				return true;
			}

			if (
				notification &&
				notification.type === "ProjectActivity" &&
				notification.read === false
			) {
				return true;
			}

			if (notification && notification.type === "Progetto" && notification.read === false) {
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

			return false;
		});
	}

	async function getCurrentUser(): Promise<Promise<any> | null> {
		try {
			const res = await fetch(`${SERVER_API}/users`);
			if (!res.ok) {
				return null;
			}
			const data: User = await res.json();
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

			console.log("Notifications:", data);
			if (data.status === ResponseStatus.GOOD) {
				setNotifications(data.value);
			} else {
				console.error("Error:", data.message);
			}
		} catch (error) {
			console.error("Fetch error:", error);
		}
	};

	// Ottengo tutti gli eventi, e guardo se la currentDate cade in un evento di tipo "NON DISTURBARE". Se si, ritorna true.
	const checkDoNotDisturb = async (): Promise<void> => {
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			console.error("Utente non trovato");
			return;
		}

		const owner = currentUser.value._id.toString();

		try {
			const res = await fetch(`${SERVER_API}/events/owner?owner=${owner}`);

			if (!res.ok) {
				throw new Error("Errore nel ritrovare eventi dell'utente");
			}

			const eventi = await res.json();

			if (!eventi) {
				throw new Error("eventi non sono stati trovati");
			}

			const eventiValue = eventi.value;
			console.log("eventiValue:", eventiValue);

			if (!eventiValue) {
				throw new Error("eventiValue non è definito");
			}

			for (const evento of eventiValue) {
				if (evento.title === "Non disturbare") {
					const startTime = new Date(evento.startTime);
					const endTime = new Date(evento.endTime);
					if (currentDate >= startTime && currentDate <= endTime) {
						setDoNotDisturb(true); // Trovato evento non disturbare, non ricevere inviti eventi/attività finchè è true
						return;
					}
				}
			}
		} catch (e) {
			console.error("Errore nel ritrovare eventi dell'utente", e);
			setDoNotDisturb(false);
		}
		// Se non trova l'evento non disturbare, allora non disturbare è false
		setDoNotDisturb(false);
	};

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			// await postCurrentDate(currentDate); // Invia la data corrente al server
			const savedDate = localStorage.getItem('currentDate');
			if (savedDate) {
				setCurrentDate(new Date(savedDate));
				setIsDateLoaded(true);
			}
			const response = await fetch(`${SERVER_API}/currentDate`);
			if (!response.ok) {
				throw new Error("Errore nel recupero della data corrente");
			}
			const data = await response.json();

			const newDate = new Date(data.currentDate);
			newDate.setSeconds(newDate.getSeconds() + 1);
			setCurrentDate(newDate);
			localStorage.setItem('currentDate', newDate.toISOString());
			triggerAction();

			const currentUser = await getCurrentUser();

			if (!currentUser) {
				console.error("Utente non trovato");
				return;
			}

			setUser(currentUser.value._id.toString());
			setUsername(currentUser.value.username);
			console.log("Questo è il username dell'utente:", username);
			setProfileImage(currentUser.value.profileImage);
		};

		fetchData();
	}, []);

	useEffect(() => {
		fetchNotifications();
		checkDoNotDisturb();

		const intervalId = setInterval(() => {
			if (!showTimeMachine) {
				fetchCurrentDate();
			}
		}, 1000);

		return () => clearInterval(intervalId);
	}, [showTimeMachine]);
	/*
		useEffect(() => {
			let timer: NodeJS.Timeout;
	
			// Funzione per controllare le notifiche
			const checkNotifications = (): void => {
				if (notifications.length > previousNotificationsRef.current.length) {
					const newNotification = notifications[notifications.length - 1];
					console.log("currentDate:", currentDate);
					console.log("newNotification.data.date:", newNotification.data.date);
	
					if (new Date(newNotification.data.date).getTime() < currentDate.getTime()) {
						setOverlayText(newNotification.message);
						setShowOverlay(true);
						setOverlayOpacity(1);
	
						// Fade out dopo 5 secondi
						setTimeout(() => {
							setOverlayOpacity(0);
							setTimeout(() => {
								setShowOverlay(false);
								setOverlayText("");
							}, 5000);
						}, 5000);
					}
				}
				previousNotificationsRef.current = notifications;
			};
	
			// Esegui il controllo ogni 5 secondi
			timer = setInterval(checkNotifications, 5000);
	
			// Esegui il primo controllo immediatamente
			checkNotifications();
	
			// Cleanup
			return () => {
				if (timer) {
					clearInterval(timer);
					setShowOverlay(false);
					setOverlayText("");
					setOverlayOpacity(0);
				}
			};
		}, [notifications, currentDate]); // Aggiungi currentDate come dipendenza
	*/


	// Guarda se ci sono notifiche al caricamento del componente
	useEffect(() => {
		fetchNotifications();
		checkDoNotDisturb();
	}, []);

	function toggleDropdown(): void {
		setShowDropdown((prevState) => !prevState);
		console.log("showDropdown:", showDropdown);
	}

	useEffect(() => {
		const header = document.querySelector(".header-container");

		const handleScroll = (): void => {
			if (header) {
				// Controlla se l'header è attaccato al top
				if (window.scrollY > 0) {
					header.classList.add("sticky");
				} else {
					header.classList.remove("sticky");
				}
			}
		};

		window.addEventListener("scroll", handleScroll);

		// Cleanup
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return (
		<header className="header-container">
			{/*Parte sinistra dell'header*/}
			<div className="left-menu-buttons">
				<a className="header-home" href="/">
					<img
						src="/images/logo.jpeg"
						alt="logo.jpeg"
						title="Home"
						style={{ margin: "0.5em" }}
					/>
					<div
						className="selfie-title"
						style={{ alignSelf: "center", textAlign: "center" }}>
						SELFIE
					</div>
				</a>

				<a className="header-link" href="/calendar" title="Calendario">
					Calendario
				</a>
				<a className="header-link" href="/pomodoro" title="Pomodoro">
					Pomodoro
				</a>
				<a className="header-link" href="/notes" title="Note">
					Note
				</a>
				<a className="header-link" href="/projects" title="Progetti">
					Progetti
				</a>
				<a className="header-link" href="/activities" title="Attività">
					Attività
				</a>
			</div>

			<div className="dropdown-container">
				<a href="/">
					<img src="/images/logo.jpeg" alt="logo.jpeg" title="Home" />
				</a>
				<button
					type="button"
					className="header-link header-menu-button"
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
							<a href="/calendar" className="header-link" title="Calendario">
								Calendario
							</a>
						</li>
						<li>
							<a href="/pomodoro" className="header-link" title="Pomodoro">
								Pomodoro
							</a>
						</li>
						<li>
							<a href="/notes" className="header-link" title="Note">
								Note
							</a>
						</li>
						<li>
							<a href="/projects" className="header-link" title="Progetti">
								Progetti
							</a>
						</li>
						<li>
							<a href="/activities" className="header-link" title="Attività">
								Attività
							</a>
						</li>
					</ul>
				</button>
			</div>

			{isLoggedIn ? (
				<div className="right-menu-buttons">
					{currentDate && isDateLoaded && (
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
						onClick={(): void => {
							setShowTimeMachine(!showTimeMachine);
							setShowNotifications(false);
						}}>
						{/* Icona della clessidra */}
						<i className="fas fa-hourglass"></i>
					</button>

					{showTimeMachine && (
						<>
							<div className="time-machine-form">
								<label htmlFor="dateInput">
									Cambia la data odierna:
									<input
										className="btn border"
										type="date"
										id="dateInput"
										value={
											currentDate
												? currentDate.toISOString().split("T")[0]
												: ""
										}
										onChange={(event): void => {
											const inputDate = event.target.value;
											const parsedDate = new Date(inputDate);

											if (isNaN(parsedDate.getTime())) {
												console.error("Data non valida:", inputDate);
												return;
											}

											setCurrentDate(parsedDate);
											triggerAction();
										}}
										style={{ marginLeft: "10px" }}
									/>
								</label>

								<label htmlFor="timeInput">
									Cambia l'orario:
									<input
										className="btn border"
										type="time"
										id="timeInput"
										defaultValue={
											currentDate
												? `${currentDate.getHours().toString().padStart(2, "0")}:${currentDate
													.getMinutes()
													.toString()
													.padStart(2, "0")}`
												: ""
										}
										onChange={async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
											const [hours, minutes] = e.target.value.split(":");
											const newDate = new Date(currentDate);
											newDate.setHours(Number(hours), Number(minutes));
											await postCurrentDate(newDate);
											triggerAction();
										}}
										onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
											if (e.key === "Backspace") {
												e.preventDefault();
											}
										}}
										style={{ marginLeft: "10px" }}
									/>
								</label>

								<button
									className="btn secondary"
									onClick={async (): Promise<void> => {
										await postCurrentDate(currentDate);
										setShowTimeMachine(false);
									}}
									style={buttonStyle}>
									Imposta Data
								</button>

								<button
									className="btn secondary"
									onClick={async (): Promise<void> => {
										const newDate = new Date();
										await postCurrentDate(newDate);
										setCurrentDate(newDate);
										triggerAction();
										setShowTimeMachine(false);
									}}
									style={buttonStyle}>
									Resetta Data
								</button>
							</div>
						</>
					)}

					<button
						className="btn secondary time-machine-button"
						title="Notifiche"
						style={{
							...buttonStyle,
							position: "relative", // Posizionamento relativo per il pallino
							width: "45px",
						}}
						onClick={(): void => {
							setShowTimeMachine(false);
							setShowNotifications(!showNotifications);
							playNotificationSound();
						}}>
						<i className="fas fa-bell" />
						{hasEventNotifications() && !doNotDisturb && (
							<span className="notification-dot" />
						)}
						{hasEventNotifications() && doNotDisturb && (
							<span className="notification-dot-gray" />
						)}
					</button>
					{/*
					{showOverlay && (
						<div style={{
							position: 'fixed',
							top: '50%',
							left: '50%',
							transform: 'translate(-50%, -50%)',
							backgroundColor: 'rgba(0, 0, 0, 0.8)',
							color: 'white',
							padding: '20px',
							borderRadius: '10px',
							zIndex: 1000,
							textAlign: 'center',
							opacity: overlayOpacity,
							transition: 'opacity 0.5s ease-in-out' // Aggiungi la transizione
						}}>
							{overlayText}
						</div>
					)}
					*/}
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
										//console.log("NOTIFICHE ATTUALI:", notifications);
										// TODO: Differentiate by type
										if (notification.type === "pomodoro") {
											const nCycles = notification.data.cycles || 5;
											const nStudyTime = notification.data.studyTime || 25;
											const nPauseTime = notification.data.pauseTime || 5;

											return (
												<>
													<div
														key={index}
														style={{
															color: "black",
															textDecoration: "none",
														}}>
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

											const eventDate = new Date(notification.data.date);

											// Mostra la notifica solo se la data corrente è successiva alla data della notifica
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
											const eventDate = new Date(notification.data.date);

											// Mostra la notifica solo se la data corrente è successiva alla data della notifica
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
											//	const eventDate = new Date(notification.data.date);
											//	if (eventDate < currentDate) {
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
											//}
										} else if (
											notification.type === "message" &&
											!notification.data.activity &&
											notification.receiver === user &&
											notification.read === false &&
											doNotDisturb === false
										) {
											const eventDate = new Date(notification.data.date);
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

											//const eventDate = new Date(notification.data.date);
											//		if (eventDate < currentDate) {
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
											//}
										} else if (
											notification.type === "shareEvent" &&
											notification.receiver === user &&
											notification.read === false &&
											doNotDisturb === false
										) {
											//const eventDate = new Date(notification.data.date); // Crea un oggetto Date
											//if (eventDate < currentDate) {
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
											//}
										} else if (
											notification.type === "Progetto" &&
											notification.read === false &&
											doNotDisturb === false &&
											notification.receiver === user
										) {
											return (
												<div key={index}>
													Hai ricevuto un invito per un{" "}
													<span
														style={{
															color: "purple",
															fontWeight: "bold",
														}}>
														progetto
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
																handleAddProject(notification);
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
													</button>
													{/*
													<button
														className="btn secondary"
														style={{
															background: "none",
															cursor: "pointer",
														}}
														onClick={(): void => {
															if (notification.id) {
																handleSnoozeNotification(
																	notification.id
																);
															} else {
																console.error(
																	"ID notifica non definito"
																);
															}
														}}
													>
														<i
															className="fas fa-arrows-alt-h"
															style={{
																color: "lightblue",
																fontSize: "20px",
															}}></i>{" "}
												
													</button>
													*/}
												</div>
											);
										} else if (
											notification.type === "ProjectActivity" &&
											notification.read === false &&
											doNotDisturb === false &&
											notification.receiver === user
										) {
											return (
												<div key={index}>
													Hai ricevuto un invito per un'{" "}
													<span
														style={{
															color: "orange",
															fontWeight: "bold",
														}}>
														attività
													</span>{" "}
													di un{" "}
													<span
														style={{
															color: "purple",
															fontWeight: "bold",
														}}>
														progetto
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
																handleAddProjectActivity(
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
													{/*
													<button
														className="btn secondary"
														style={{
															background: "none",
															cursor: "pointer",
														}}
														onClick={(): void => {
															if (notification.id) {
																handleSnoozeNotification(
																	notification.id
																);
															} else {
																console.error(
																	"ID notifica non definito"
																);
															}
														}}
													>
														<i
															className="fas fa-arrows-alt-h"
															style={{
																color: "lightblue",
																fontSize: "20px",
															}}></i>{" "}
													</button>
													*/}
												</div>
											);
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
								backgroundColor: "white",
								border: "none",
								cursor: "pointer",
								alignItems: "center",
								display: "flex",
								justifyContent: "center",
							}}>
							<img
								loading="lazy"
								src={
									`/images/profile/${profileImage}`
									//	profileImage
									//? `/images/profile/${profileImage}`
									//: `/images/profile/${profileImage}`
								}
								//alt="Avatar"
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
						margin: "12px",
					}}>
					Login
				</a>
			)}
		</header>
	);
}
