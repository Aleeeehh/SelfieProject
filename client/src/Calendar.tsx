import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ResponseBody } from "./types/ResponseBody";
import User from "./types/User";
import "bootstrap/dist/css/bootstrap.min.css";
import { SERVER_API } from "./params/params";
import { getDaysInMonth, startOfMonth, getDay } from "date-fns"; //funzioni di date-fns
import { ResponseStatus } from "./types/ResponseStatus";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom"
import { Event } from "./types/Event";
import SearchForm from "./SearchForm";
import SearchFormResource from "./SearchFormResource";
//import mongoose from "mongoose";


enum Frequency {
	ONCE = "once",
	DAILY = "day",
	WEEKLY = "week",
	MONTHLY = "month",
	YEARLY = "year",
}

type Activity = {
	_id: string;
	title: String;
	description?: String;
	deadline: Date;
	completed: boolean;
	completedAt?: Date;
	owner: String;
	createdAt?: Date;
	updatedAt?: Date;
	accessList: String[];
};

const Mesi = [
	"Gennaio",
	"Febbraio",
	"Marzo",
	"Aprile",
	"Maggio",
	"Giugno",
	"Luglio",
	"Agosto",
	"Settembre",
	"Ottobre",
	"Novembre",
	"Dicembre",
];
//const GiorniSettimana = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];



export default function Calendar(): React.JSX.Element { // prova push
	const [title, setTitle] = React.useState("");
	const [showRisorse, setShowRisorse] = React.useState(true);
	const [messageRisorsa, setMessageRisorsa] = React.useState("");
	const [file, setFile] = React.useState<File | null>(null);
	const [createRisorsa, setCreateRisorsa] = React.useState(false);
	const [isAdmin, setIsAdmin] = React.useState(false);
	//sconst [idAttivitàAccettate, setIdAttivitàAccettate] = React.useState<string[]>([]);

	//const [insertFile, setInsertFile] = React.useState(false);
	const [description, setDescription] = React.useState("");
	const [users, setUsers] = React.useState([] as string[]); // NOTA: uso un array perchè il componente SearchForm ha bisogno di un array di utenti, non un singolo utente
	const [accessList, setAccessList] = React.useState([] as string[]);
	const [createActivity, setCreateActivity] = React.useState(false);
	const [selectedMode, setSelectedMode] = React.useState("Eventi");
	const [create, setCreate] = React.useState(false);
	const [eventsMode, setEventsMode] = React.useState(true);
	const [todayActivitiesMode, setTodayActivitiesMode] = React.useState(true);
	const [allActivitiesMode, setAllActivitiesMode] = React.useState(false);
	const [activitiesMode, setActivitiesMode] = React.useState(false);
	const [notificationRepeat, setNotificationRepeat] = React.useState(false);
	const [notificationRepeatTime, setNotificationRepeatTime] = React.useState(0);
	const [notificationTime, setNotificationTime] = React.useState(0);
	//const [isUntilDate, setIsUntilDate] = React.useState(false);
	const [untilDate, setUntilDate] = React.useState<Date | null>(null);
	const [repetitions, setRepetitions] = React.useState(1);
	const [selectedValue, setSelectedValue] = React.useState("Data");
	const [createNonDisturbare, setCreateNonDisturbare] = React.useState(false);
	const [createEvent, setCreateEvent] = React.useState(false);
	const [frequency, setFrequency] = React.useState(Frequency.ONCE);
	const [isInfinite, setIsInfinite] = React.useState(false);
	const [currentDate, setCurrentDate] = React.useState(new Date());
	const [sendInviteActivity, setSendInviteActivity] = React.useState(false);
	const [sendInviteEvent, setSendInviteEvent] = React.useState(false);
	const [addNotification, setAddNotification] = React.useState(false);
	const [shareEvent, setShareEvent] = React.useState(false);
	const [startTime, setStartTime] = React.useState(() => {
		const now = new Date();
		return now;
	});
	const [allDayEvent, setAllDayEvent] = React.useState(false);
	const [until, setUntil] = React.useState(false);
	const [repeatEvent, setRepeatEvent] = React.useState(false);
	const [renderKey, setRenderKey] = React.useState(0);
	const [endTime, setEndTime] = React.useState(() => {
		const now = new Date();
		now.setMinutes(now.getMinutes() + 30);
		return now;
	});
	//const [loadWeek, setLoadWeek] = React.useState(false);
	const [weekEvents, setWeekEvents] = React.useState<{ day: number; positions: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number; event: Event }[] }[]>([]);
	const [monthEvents, setMonthEvents] = React.useState<{ day: number; positions: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number; event: Event }[] }[]>([]);
	const [location, setLocation] = React.useState("");
	const [meseCorrente, setMeseCorrente] = React.useState(new Date().getMonth()); //inizializzazione mese corrente
	const [message, setMessage] = React.useState("");
	const [day, setDay] = React.useState(new Date().getDate());
	const [activeButton, setActiveButton] = React.useState(0);
	const [year, setYear] = React.useState(new Date().getFullYear())
	const [shareActivity, setShareActivity] = React.useState(false);
	const [eventList, setEventList] = React.useState<Event[]>([]);
	const [activityList, setActivityList] = React.useState<Activity[]>([]);
	const [addTitle, setAddTitle] = React.useState(true);


	const [eventPositions, setEventPositions] = React.useState<{ top: number; height: number; name: string; type: boolean, width: number, marginLeft: number, event: Event }[]>([]);
	const nav = useNavigate();

	const getValidRepeatOptions = (time: number): number[] => {
		const options = [0, 5, 10, 15, 30, 60, 120, 1440]; // Opzioni disponibili
		return options.filter(option => option !== time && (time % option === 0 || option === 0)); // Filtra solo i divisori, escludendo il numero stesso
	};



	React.useEffect(() => {
		(async (): Promise<void> => {
			try {

				const res2 = await fetch(`${SERVER_API}/notifications`);
				const notifications = await res2.json();
				console.log("NOTIFICHE RIMASTE IN LISTA:", notifications);
				console.log("COSA VOGLIAMO STAMPARE:", notifications.value)
				const res = await fetch(`${SERVER_API}/events`);
				if (res.status !== 200) {
					nav("/login");
				}
				const data = (await res.json()) as ResponseBody;

				const getResponse = await fetch(`${SERVER_API}/currentDate`);
				if (!getResponse.ok) {
					throw new Error("ERRORE NELLA RICHIESTA GET DI CURRENTDATE IN CALENDAR");
				}

				const currentDateData = await getResponse.json();
				setCurrentDate(new Date(currentDateData.currentDate));
				console.log("Valore currentDate:", currentDate);

				if (data.status === ResponseStatus.GOOD) {
					setEventList(data.value);
					console.log("QUESTA E' LA EVENTLIST::", eventList);
				} else {
					setMessage("Errore nel ritrovamento degli eventi: nessun evento trovato nel database!");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	/*
	React.useEffect(() => {
		const intervalId = setInterval(() => {
			fetchCurrentDate(); // Chiama la funzione per ottenere la data corrente solo se non stai usando il time machine
		}, 1000);

		return () => clearInterval(intervalId); // Pulizia dell'intervallo al momento dello smontaggio
	}, []);
	*/

	const fetchCurrentDate = async (): Promise<void> => {
		try {
			const response = await fetch(`${SERVER_API}/currentDate`);
			if (!response.ok) {
				throw new Error("Errore nel recupero della data corrente");
			}
			const data = await response.json();
			setCurrentDate(new Date(data.currentDate)); // Assicurati che il formato sia corretto

			//ricarico la lista di attività
			//const res2 = await fetch(`${SERVER_API}/activity`); // Assicurati che l'endpoint sia corretto

			//const updatedActivities = await res2.json();
			//setActivityList(updatedActivities.value);
			//await loadActivities();
			await loadEvents();
		} catch (error) {
			console.error("Errore durante il recupero della data corrente:", error);
		}
	};

	//ogni volta che si vogliono visualizzare le attività, aggiorna la currentDate
	React.useEffect(() => {
		fetchCurrentDate();

		//aggiorna la currentDate di calendar ogni secondo
		const intervalId = setInterval(fetchCurrentDate, 1000);
		return () => clearInterval(intervalId);

	}, [activitiesMode,]); // Chiamata GET ogni volta che activitiesMode cambia


	React.useEffect(() => {
		if (isInfinite === true) {
			setNotificationRepeat(false);
		}
	}, [isInfinite]);


	function renderWeekEvents(weekEvents: { positions: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number; event: Event }[] }[], index: number): JSX.Element {
		if (!weekEvents[index] || !weekEvents[index].positions) {
			return <div> </div>;
		}
		return (
			<div style={{ position: "relative", marginLeft: "18%" }}>
				{weekEvents[index].positions.map((event, idx) => (
					<div
						key={idx}
						className={`evento ${!event.type ? 'red' : 'blue'}`}
						style={{
							top: `${event.top}px`,
							height: `${event.height}px`,
							width: `calc(95%/${event.width})`,
							position: "absolute",
							color: !event.type ? "red" : "rgb(155, 223, 212)",
							borderColor: !event.type ? "red" : "rgb(155, 223, 212)",
							backgroundColor: !event.type ? "rgba(249, 67, 67, 0.5)" : "rgba(155, 223, 212, 0.5)",
							marginLeft: `${event.marginLeft}%`,
							cursor: "default",
						}}
					>
						<div style={{ color: !event.type ? "red" : "rgb(155, 223, 212)" }}>
							{!event.type ? (
								<Link
									to={`/pomodoro?duration=${((startTime, endTime): number => {
										const start = new Date(startTime);
										const end = new Date(endTime);
										const totMin = Math.max((end.getTime() - start.getTime()) / (1000 * 60), 0);
										return totMin;
									})(event.event.startTime, event.event.endTime)
										}&id=${event.event._id}`}
									style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
								>
									{event.name}
								</Link>
							) : (
								<span>{event.name}</span>
							)}
						</div>
						<div className="position-relative" onClick={async (e): Promise<void> => {
							await handleDeleteEvent(event.event._id, event.event.groupId);

							weekMode(e as React.MouseEvent<HTMLElement>);
						}}>
							<i className="bi bi-trash"
								style={{
									bottom: "2px",
									right: "50%",
									fontSize: "1.5rem",
									margin: 0,
									padding: 0,
									color: !event.type ? "red" : "rgb(155, 223, 212)",
									cursor: "pointer"
								}}
							></i>
						</div>
					</div>
				))}
			</div>
		);

	}


	function renderMonthEvents(monthEvents: { positions: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number; event: Event }[] }[], index: number): JSX.Element {
		if (!monthEvents[index] || !monthEvents[index].positions) {
			return <div> </div>;
		}
		//console.log(`Superato if, e renderizzati eventi del giorno: ${index}`);
		return (
			<div style={{ position: "relative" }}>
				{monthEvents[index].positions.map((event, idx) => {
					if (idx < 5) {
						// Renderizza i primi 5 eventi normalmente
						return (
							<div
								key={idx}
								className={`evento ${!event.type ? 'red' : 'blue'}`}
								style={{
									top: `0px`,
									height: `15px`,
									width: `130px`,
									position: "relative",
									color: !event.type ? "red" : "rgb(155, 223, 212)",
									borderColor: !event.type ? "red" : "rgb(155, 223, 212)",
									backgroundColor: !event.type ? "rgba(249, 67, 67, 0.5)" : "rgba(155, 223, 212, 0.5)",
									marginLeft: `0px`,
									cursor: "default",
									marginBottom: "1px",
									fontSize: "12px"
								}}
							>
								<div style={{ color: !event.type ? "red" : "rgb(155, 223, 212)" }}>
									{!event.type ? (
										<Link
											to={`/pomodoro?duration=${((startTime, endTime): number => {
												const start = new Date(startTime);
												const end = new Date(endTime);
												const totMin = Math.max((end.getTime() - start.getTime()) / (1000 * 60), 0);
												return totMin;
											})(event.event.startTime, event.event.endTime)
												}&id=${event.event._id}`}
											style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
										>
											{((): any => {
												const endTime = new Date(new Date(event.event.endTime).getFullYear(), new Date(event.event.endTime).getMonth(), new Date(event.event.endTime).getDate());
												const startTimeOrario = new Date(event.event.startTime);
												const endTimeOrario = new Date(event.event.endTime);
												const startTime = new Date(new Date(event.event.startTime).getFullYear(), new Date(event.event.startTime).getMonth(), new Date(event.event.startTime).getDate());
												const isSameDay = endTime.getTime() === startTime.getTime(); //se l'evento inizia e termina lo stesso giorno, mostra l'orario

												const isAllDayEvent = startTimeOrario.getHours() === 0 && startTimeOrario.getMinutes() === 0 &&
													endTimeOrario.getHours() === 23 && endTimeOrario.getMinutes() === 50;
												var nameToDisplay = event.name.length > (isSameDay ? 10 : 15) ? `${event.name.substring(0, isSameDay ? 10 : 15)}...` : event.name;
												nameToDisplay = event.name.length > (isAllDayEvent ? 15 : 10) ? `${event.name.substring(0, isAllDayEvent ? 15 : 10)}...` : event.name;

												const timeToDisplay = (isSameDay && !isAllDayEvent) ? startTimeOrario.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
												/*console.log("Start Time Ore:", startTimeOrario.getHours());
												console.log("Start Time minuti:", startTimeOrario.getMinutes());
												console.log("End Time Ore:", endTimeOrario.getHours());
												console.log("End Time Minuti:", endTimeOrario.getMinutes());
												console.log("Is All Day Event:", isAllDayEvent);
												*/

												return (
													<>
														{nameToDisplay}
														{"  "}
														{timeToDisplay}
													</>
												);
											})()}
										</Link>
									) : (
										<span>
											{((): any => {
												const endTime = new Date(new Date(event.event.endTime).getFullYear(), new Date(event.event.endTime).getMonth(), new Date(event.event.endTime).getDate());
												const startTimeOrario = new Date(event.event.startTime);
												const endTimeOrario = new Date(event.event.endTime);
												const startTime = new Date(new Date(event.event.startTime).getFullYear(), new Date(event.event.startTime).getMonth(), new Date(event.event.startTime).getDate());
												const isSameDay = endTime.getTime() === startTime.getTime(); //se l'evento inizia e termina lo stesso giorno, mostra l'orario

												const isAllDayEvent = startTimeOrario.getHours() === 0 && startTimeOrario.getMinutes() === 0 &&
													endTimeOrario.getHours() === 23 && endTimeOrario.getMinutes() === 50;
												var nameToDisplay = event.name.length > (isSameDay ? 10 : 15) ? `${event.name.substring(0, isSameDay ? 10 : 15)}...` : event.name;
												nameToDisplay = event.name.length > (isAllDayEvent ? 15 : 10) ? `${event.name.substring(0, isAllDayEvent ? 15 : 10)}...` : event.name;
												const timeToDisplay = (isSameDay && !isAllDayEvent) ? startTimeOrario.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
												/*console.log("Start Time Ore:", startTimeOrario.getHours());
												console.log("Start Time minuti:", startTimeOrario.getMinutes());
												console.log("End Time Ore:", endTimeOrario.getHours());
												console.log("End Time Minuti:", endTimeOrario.getMinutes());
												console.log("Is All Day Event:", isAllDayEvent);
												*/

												return (
													<>
														{nameToDisplay}
														{"  "}
														{timeToDisplay}
													</>
												);
											})()}
										</span>
									)}
								</div>
							</div>
						);
						//renderizza il sesto evento
					} else if (idx === 5) {
						// Se ci sono esattamente 6 eventi, renderizza il sesto evento normalmente
						if (monthEvents[index].positions.length === 6) {
							return (
								<div
									key={idx}
									className={`evento ${!event.type ? 'red' : 'blue'}`}
									style={{
										top: `0px`,
										height: `15px`,
										width: `130px`,
										position: "relative",
										color: !event.type ? "red" : "rgb(155, 223, 212)",
										borderColor: !event.type ? "red" : "rgb(155, 223, 212)",
										backgroundColor: !event.type ? "rgba(249, 67, 67, 0.5)" : "rgba(155, 223, 212, 0.5)",
										marginLeft: `0px`,
										cursor: "default",
										marginBottom: "1px",
										fontSize: "12px"
									}}
								>
									<div style={{ color: !event.type ? "red" : "rgb(155, 223, 212)" }}>
										{!event.type ? (
											<Link
												to={`/pomodoro?duration=${((startTime, endTime): number => {
													const start = new Date(startTime);
													const end = new Date(endTime);
													const totMin = Math.max((end.getTime() - start.getTime()) / (1000 * 60), 0);
													return totMin;
												})(event.event.startTime, event.event.endTime)
													}&id=${event.event._id}`}
												style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
											>
												{event.name.length > 12 ? `${event.name.substring(0, 12)}...` : event.name}
												{"  "}
												{((): any => {
													const startTime = new Date(event.event.startTime);
													startTime.setHours(startTime.getHours());
													return startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
												})()}
											</Link>
										) : (
											<span>
												{event.name.length > 12 ? `${event.name.substring(0, 12)}...` : event.name}
												{"  "}
												{((): any => {
													const startTime = new Date(event.event.startTime);
													startTime.setHours(startTime.getHours());
													return startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
												})()}
											</span>
										)}
									</div>
								</div>
							);
						} else {
							// Se ci sono più di 6 eventi, renderizza il sesto evento come "..."
							return (
								<div
									key={idx}
									className="evento blue"
									style={{
										top: `0px`,
										height: `15px`,
										width: `130px`,
										position: "relative",
										color: "rgb(155, 223, 212)",
										backgroundColor: "rgba(155, 223, 212, 0.5)",
										marginLeft: `0px`,
										cursor: "default",
										marginBottom: "1px",
										fontSize: "12px",
										textAlign: "center"
									}}
								>
									<span>...</span>
								</div>
							);
						}

					}
					// Non renderizzare eventi oltre il sesto

					return null;
				})}
			</div>
		);

	}

	async function handleDownloadCalendar(): Promise<void> {
		const currentUser = await getCurrentUser();
		const owner = currentUser.value.username;
		const res = await fetch(`${SERVER_API}/events/ical?owner=${owner}`);
		if (res.ok) {
			const data = await res.blob();  // Ottieni il blob del file
			console.log("icalString:", data);
			const url = URL.createObjectURL(data); // Crea un URL per il blob
			const a = document.createElement('a'); // Crea un elemento <a>
			a.style.display = 'none'; // Nascondi l'elemento
			a.href = url; // Imposta l'URL del blob come href
			a.download = 'calendar.ics'; // Nome del file da scaricare
			a.click(); // Simula un clic per avviare il download
			window.URL.revokeObjectURL(url); // Pulisce l'URL del blob
		} else {
			setMessage("Errore nel download del calendario");
		}
	}

	async function handleImportCalendar(): Promise<void> {
		if (!file) {
			console.log("Nessun file selezionato");
			return;
		}

		const currentUser = await getCurrentUser();
		const owner = currentUser.value.username;

		const formData = new FormData();
		formData.append('calendarFile', file); // Aggiungi il file al FormData
		formData.append('owner', owner); // Aggiungi l'owner al FormData
		console.log("Questo è il file:", file);

		// Esegui una richiesta per importare il file
		const response = await fetch(`${SERVER_API}/events/importCalendar`, {
			method: 'POST',
			body: formData,
		});

		if (response.ok) {
			console.log("Calendario importato con successo");
		} else {
			console.error("Errore durante l'importazione del calendario");
		}
		loadEvents();
		handleDateClick(day);
	};


	async function loadEvents(): Promise<void> {
		try {
			const currentUser = await getCurrentUser();
			//console.log("Valore ottenuto:", currentUser);

			const owner = currentUser.value.username;
			//console.log("Questo è l'owner:", owner);
			const res = await fetch(`${SERVER_API}/events/owner?owner=${owner}`);
			const data = await res.json();
			console.log("Eventi trovati:", data.value);
			//console.log("Eventi trovati:", data);

			if (data.status === ResponseStatus.GOOD) {
				setEventList(data.value);
				//console.log("stampo data.values:", data.value);
			} else {
				setMessage("Errore nel ritrovamento degli eventi");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
		const file = e.target.files?.[0];
		if (file) {
			setFile(file);
		}
	}

	async function loadActivities(): Promise<void> {
		const currentUser = await getCurrentUser();
		const owner = currentUser.value.username;
		const resActivities = await fetch(`${SERVER_API}/activity/owner?owner=${owner}`);
		const dataActivities = await resActivities.json();
		console.log("Attività trovate dalla loadActivities:", dataActivities);
		if (dataActivities.status === ResponseStatus.GOOD) {
			//ULTIMA MODIFICA

			//salvo il risultato in una variabile
			const activities = dataActivities.value;
			console.log("Queste sono le attività:", activities);

			//aggiungo subito nel calendario, le attività che hanno come owner l'utente corrente
			//(in quanto le ha create lui, o sono destinate solo a lui)
			//const filteredActivities = activities.filter((activity: any) => activity.owner === owner);

			setActivityList(activities);



			//setActivityList(activities);
			//console.log("Questa è la lista delle attività:", activityList);
		}
		else {
			//setMessage("ERRORE RITROVAMENTO ATTIVITA'");
		}
	}

	React.useEffect(() => {
		loadEvents();
	}, []);

	/*
		React.useEffect(() => {
			//loadEvents();
		}, [currentDate]);
		/*
	/*
		React.useEffect(() => {
			handleDateClick(day);
		}, [eventList]);
		*/
	React.useEffect(() => {
		loadActivities();
	}, []);

	React.useEffect(() => {
		handleDateClick(day);
	}, [meseCorrente]);

	React.useEffect(() => {
		handleDateClick(day);
	}, [year]);

	function dayMode(e: React.MouseEvent<HTMLElement>): void {
		e.preventDefault();
		setActiveButton(0);
		//setLoadWeek(false);
		console.log(activeButton);
	}

	async function weekMode(e: React.MouseEvent<HTMLElement>): Promise<void> {
		e.preventDefault();
		setWeekEvents([]);
		console.log("Questi sono i valori di year, meseCorrente, day:", year, meseCorrente, day);
		const startDay = getStartDayOfWeek(year, meseCorrente, day);
		await loadWeekEvents(startDay, year, meseCorrente);
		setActiveButton(1);
		console.log("Questi sono gli eventi della settimana intera e le loro posizioni:", weekEvents);
	}

	async function monthMode(e: React.MouseEvent<HTMLElement>): Promise<void> {
		e.preventDefault();
		setMonthEvents([]);
		await loadMonthEvents(year, meseCorrente);
		console.log("questi sono gli eventi del mese:", monthEvents);
		setActiveButton(2);
		//setLoadWeek(false);
		console.log(activeButton);
	}

	async function nextWeek(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		setWeekEvents([]);
		e.preventDefault();

		let newDay = day + 7;
		let newMonth = meseCorrente;
		let newYear = year;

		while (newDay > getDaysInMonth(new Date(newYear, newMonth))) {
			newDay -= getDaysInMonth(new Date(newYear, newMonth));
			newMonth = (newMonth + 1) % 12;
			if (newMonth === 0) {
				newYear += 1;
			}
		}

		setDay(newDay);
		setMeseCorrente(newMonth);
		setYear(newYear);
		const startDay = getStartDayOfWeek(newYear, newMonth, newDay);
		await loadWeekEvents(startDay, newYear, newMonth);
	}

	async function prevWeek(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		setWeekEvents([]);
		e.preventDefault();
		let newDay = day - 7;
		let newMonth = meseCorrente;
		let newYear = year;

		while (newDay < 1) {
			newMonth = (newMonth - 1 + 12) % 12;
			if (newMonth === 11) {
				newYear -= 1;
			}
			newDay += getDaysInMonth(new Date(newYear, newMonth));
		}

		setDay(newDay);
		setMeseCorrente(newMonth);
		setYear(newYear);
		const startDay = getStartDayOfWeek(newYear, newMonth, newDay);
		await loadWeekEvents(startDay, newYear, newMonth);
	}

	async function mesePrecedente(): Promise<void> {
		setMonthEvents([]);
		const nuovoMese = (meseCorrente - 1) % 12;
		const nuovoAnno = year + (nuovoMese === 0 ? 1 : 0);
		setEventPositions([]);
		if (meseCorrente === 0) {
			setMeseCorrente((meseCorrente - 1 + 12) % 12);
			setYear(year - 1);
		} else {
			setMeseCorrente((meseCorrente - 1 + 12) % 12);
		}

		if ((nuovoMese === 3 || nuovoMese === 5 || nuovoMese === 8 || nuovoMese === 10) && day === 31) {
			setDay(30);
		}

		if (nuovoMese === 1 && (day === 29 || day === 30 || day === 31)) {
			// Controlla se l'anno è bisestile
			if (nuovoAnno % 4 === 0 && (nuovoAnno % 100 !== 0 || nuovoAnno % 400 === 0)) {
				// Anno bisestile
				setDay(29);
			} else {
				// Anno normale
				setDay(28);
			}
		}
		await loadMonthEvents(nuovoAnno, nuovoMese);
	}

	async function meseSuccessivo(): Promise<void> {
		setMonthEvents([]);
		setEventPositions([]);
		const nuovoMese = (meseCorrente + 1) % 12;
		const nuovoAnno = year + (nuovoMese === 0 ? 1 : 0);
		if (meseCorrente === 11) {
			setMeseCorrente((meseCorrente + 1) % 12);
			setYear(year + 1);
		} else {
			setMeseCorrente((meseCorrente + 1) % 12);
		}
		if ((nuovoMese === 3 || nuovoMese === 5 || nuovoMese === 8 || nuovoMese === 10) && day === 31) {
			setDay(30);
		}
		if (nuovoMese === 1 && (day === 29 || day === 30 || day === 31)) {
			// Controlla se l'anno è bisestile
			if (nuovoAnno % 4 === 0 && (nuovoAnno % 100 !== 0 || nuovoAnno % 400 === 0)) {
				// Anno bisestile
				setDay(29);
			} else {
				// Anno normale
				setDay(28);
			}
		}
		await loadMonthEvents(nuovoAnno, nuovoMese);
	}

	React.useEffect(() => {
		if (!repeatEvent) {
			setUntilDate(null);
			setFrequency(Frequency.ONCE);
			setRepetitions(1);
			setIsInfinite(false);
		}
	}, [repeatEvent]);

	React.useEffect(() => {
		if (frequency === Frequency.ONCE) {
			setUntilDate(null);
			setFrequency(Frequency.ONCE);
			setRepetitions(1);
			setIsInfinite(false);
		}
	}, [frequency]);


	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const currentUser = await getCurrentUser();
				console.log("Valore ottenuto:", currentUser);

				const owner = currentUser.value.username;
				console.log("Questo è l'ownerr:", owner);
				if (owner === "fvPM") { //se l'utente è il PM, allora è admin per le risorse
					setIsAdmin(true);
				}
				const res = await fetch(`${SERVER_API}/events/owner?owner=${owner}`);
				const data = await res.json();
				console.log("Eventi trovati:", data);

				if (data.status === ResponseStatus.GOOD) {
					setEventList(data.value);
					console.log("stampo data.valuess:", data.value);
				}
				else {
					setMessage("Errore nel ritrovamento degli eventi");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	React.useEffect(() => {
		//console.log("EventList aggiornato", eventList);
	}, [eventList]); // Esegui questo effetto ogni volta che eventList cambia

	React.useEffect(() => {
		//console.log("ActivityList aggiornato", activityList);
	}, [activityList]); // Esegui questo effetto ogni volta che activityList cambia

	React.useEffect(() => {
		//console.log("CurrentDate aggiornato", currentDate);
	}, [currentDate]); // Esegui questo effetto ogni volta che currentDate cambia

	//funzione per aggiungere pallino al giorno che contiene eventi
	function hasEventsForDay(day: number): boolean {
		// Controlla se la eventList è vuota
		if (eventList.length === 0) {
			return false;
		}

		return eventList.some(event => {
			const eventStartDate = new Date(event.startTime);
			const eventEndDate = new Date(event.endTime);
			const currentDate = new Date(year, meseCorrente, day);

			// Normalizza le date per confrontare solo giorno, mese e anno
			const normalizeDate: (date: Date) => Date = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

			const normalizedEventStartDate = normalizeDate(eventStartDate);
			const normalizedEventEndDate = normalizeDate(eventEndDate);
			const normalizedCurrentDate = normalizeDate(currentDate);

			// Controlla se l'evento è nel giorno selezionato
			const isSameDayEvent = (
				normalizedCurrentDate >= normalizedEventStartDate &&
				normalizedCurrentDate <= normalizedEventEndDate
			);

			// Controlla se l'evento è giornaliero, infinito e iniziato prima o nello stesso giorno del currentDate
			const isDailyInfiniteEvent = (
				event.frequency === "day" &&
				event.isInfinite === true &&
				normalizedEventStartDate <= normalizedCurrentDate
			);

			const isMonthlyInfiniteEvent = (
				event.frequency === "month" &&
				event.isInfinite === true &&
				eventStartDate.getDate() === currentDate.getDate() && //controlla se è lo stesso giorno del mese
				normalizedEventStartDate <= normalizedCurrentDate
			);


			const isWeeklyInfiniteEvent = (
				event.frequency === "week" &&
				event.isInfinite === true &&
				normalizedEventStartDate <= normalizedCurrentDate &&
				eventStartDate.getDay() === currentDate.getDay()  //controlla se è lo stesso giorno della settimana
			);

			const isYearlyInfiniteEvent = (
				event.frequency === "year" &&
				event.isInfinite === true &&
				normalizedEventStartDate <= normalizedCurrentDate &&
				eventStartDate.getDate() === currentDate.getDate() && //controlla se è lo stesso giorno del mese
				eventStartDate.getMonth() === currentDate.getMonth()  //controlla se è lo stesso mese
			);

			// Ritorna true se l'evento è nello stesso giorno o se è giornaliero e infinito
			return isSameDayEvent || isDailyInfiniteEvent || isMonthlyInfiniteEvent || isWeeklyInfiniteEvent || isYearlyInfiniteEvent;
		});
	}

	const activitiesCheScadonoOggi = activityList.filter(activity => {
		const deadline = new Date(activity.deadline);
		return (
			deadline.getFullYear() === year &&
			deadline.getMonth() === meseCorrente &&
			deadline.getDate() === day
		);
	});

	function toggleAddNotification(): void {
		setAddNotification(!addNotification);
	}

	function toggleShowRisorse(): void {
		setShowRisorse(!showRisorse);
	}

	function toggleTodayActivitiesMode(): void {
		if (!todayActivitiesMode) {
			setTodayActivitiesMode(true);
			setAllActivitiesMode(false);
		}
		fetchCurrentDate();

	}

	async function toggleAllActivitiesMode(): Promise<void> {
		if (!allActivitiesMode) {
			setTodayActivitiesMode(false);
			setAllActivitiesMode(true);
		}

		fetchCurrentDate();
		await loadActivities();
	}

	function toggleCreateEvent(): void {
		if (createActivity) {
			setCreateActivity(false);
		}
		if (createNonDisturbare) {
			setCreateNonDisturbare(false);
		}
		if (createRisorsa) {
			setCreateRisorsa(false);
		}
		if (!createEvent) {
			// Usa l'ora corrente o l'ora di startTime
			const currentHours = startTime.getHours();
			const currentMinutes = startTime.getMinutes();
			const endHours = endTime.getHours();
			const endMinutes = endTime.getMinutes();

			// Imposta startTime con day, meseCorrente, year e l'ora corrente
			var initialStartTime = new Date(year, meseCorrente, day, currentHours, currentMinutes, 0, 0);
			setStartTime(initialStartTime);

			// Imposta endTime a 30 minuti dopo startTime
			var initialEndTime = new Date(year, meseCorrente, day, endHours, endMinutes, 0, 0);
			if ((initialEndTime.getTime() - initialStartTime.getTime()) / (1000 * 60) < 30) {
				initialEndTime = new Date(initialStartTime); // Crea un nuovo oggetto Date
				initialEndTime.setMinutes(initialStartTime.getMinutes() + 30);
			}
			setEndTime(initialEndTime);
		}
		setAddTitle(true);
		setRepeatEvent(false);
		setAddNotification(false);
		setAllDayEvent(false);
		setNotificationRepeat(false);
		setNotificationRepeatTime(0);
		setUntil(false);
		setTitle("");
		setCreateEvent(!createEvent);
		setFrequency(Frequency.ONCE);
		setShareEvent(false);
	}

	function toggleCreateNonDisturbare(): void {
		if (createActivity) {
			setCreateActivity(false);
		}

		if (createEvent) {
			setCreateEvent(false);
		}
		if (createRisorsa) {
			setCreateRisorsa(false);
		}
		if (!createNonDisturbare) {
			// Usa l'ora corrente o l'ora di startTime
			const currentHours = startTime.getHours();
			const currentMinutes = startTime.getMinutes();
			const endHours = endTime.getHours();
			const endMinutes = endTime.getMinutes();

			// Imposta startTime con day, meseCorrente, year e l'ora corrente
			var initialStartTime = new Date(year, meseCorrente, day, currentHours, currentMinutes, 0, 0);
			setStartTime(initialStartTime);

			// Imposta endTime a 30 minuti dopo startTime
			var initialEndTime = new Date(year, meseCorrente, day, endHours, endMinutes, 0, 0);
			if ((initialEndTime.getTime() - initialStartTime.getTime()) / (1000 * 60) < 30) {
				initialEndTime = new Date(initialStartTime); // Crea un nuovo oggetto Date
				initialEndTime.setMinutes(initialStartTime.getMinutes() + 30);
			}
			setEndTime(initialEndTime);
		}
		setAddTitle(true);
		setRepeatEvent(false);
		setAddNotification(false);
		setAllDayEvent(false);
		setNotificationRepeat(false);
		setNotificationRepeatTime(0);
		setUntil(false);
		setTitle("");
		setCreateNonDisturbare(!createNonDisturbare);
		setFrequency(Frequency.ONCE);
		setShareEvent(false);
		setUsers([]);
		setAccessList([]);
		setMessageRisorsa("");
	}

	function toggleCreateRisorsa(): void {
		if (createActivity) {
			setCreateActivity(false);
		}

		if (createEvent) {
			setCreateEvent(false);
		}
		if (createNonDisturbare) {
			setCreateNonDisturbare(false);
		}
		setTitle("");
		setDescription("");
		setCreateRisorsa(!createRisorsa);
	}

	function toggleCreate(): void {
		setCreate(!create);
	}

	function toggleCreateActivity(): void {
		if (createEvent) {
			setCreateEvent(false);
		}
		if (createNonDisturbare) {
			setCreateNonDisturbare(false);
		}
		if (createRisorsa) {
			setCreateRisorsa(false);
		}
		if (!createActivity) {
			// Usa l'ora corrente o l'ora di startTime
			const currentHours = startTime.getHours();
			const currentMinutes = startTime.getMinutes();
			const endHours = endTime.getHours();
			const endMinutes = endTime.getMinutes();

			// Imposta startTime con day, meseCorrente, year e l'ora corrente
			var initialStartTime = new Date(year, meseCorrente, day, currentHours, currentMinutes, 0, 0);
			setStartTime(initialStartTime);

			// Imposta endTime a 30 minuti dopo startTime
			var initialEndTime = new Date(year, meseCorrente, day, endHours, endMinutes, 0, 0);
			if ((initialEndTime.getTime() - initialStartTime.getTime()) / (1000 * 60) < 30) {
				initialEndTime = new Date(initialStartTime); // Crea un nuovo oggetto Date
				initialEndTime.setMinutes(initialStartTime.getMinutes() + 30);
			}
			setEndTime(initialEndTime);
		}
		setAddTitle(true);
		setCreateActivity(!createActivity);
		setNotificationRepeat(false);
		setAddNotification(false);
		setSendInviteActivity(false);
		setShareActivity(false);
	}

	const handleScroll = (e: React.WheelEvent<HTMLDivElement>): void => {
		//e.preventDefault(); // Previene il comportamento di scroll predefinito
		const scrollAmount = e.deltaY; // Ottieni la quantità di scroll
		const orarioDivs = document.querySelectorAll('.orario'); // Seleziona tutti i div con classe 'orario'

		// Calcola il nuovo scroll per il div attivo
		const activeDiv = e.currentTarget as HTMLDivElement;
		const newScrollTop = activeDiv.scrollTop + scrollAmount;

		// Applica lo scroll a ciascun div
		orarioDivs.forEach(div => {
			div.scrollTop = newScrollTop; // Imposta la stessa posizione di scroll
		});
	};

	async function handleDateClick(e: React.MouseEvent<HTMLButtonElement> | number): Promise<void> {
		//console.log("SITUAZIONE EVENT LIST PRIMA DEL CLICK:", eventList);
		//e.preventDefault();
		fetchCurrentDate();
		setEventPositions([]);
		setRenderKey(prevKey => prevKey + 1);
		//console.log("renderKey:", renderKey);
		//console.log("Questo è ciò che viene passato in input alla handleDateClick:", e);
		let dayValue: number;
		//console.log(day, Mesi[meseCorrente], year);
		//console.log(day, meseCorrente, year);

		if (typeof e === "number") {
			dayValue = e;
		}
		else {
			dayValue = Number(e.currentTarget.textContent);
		}
		//console.log("Clicked day:", dayValue); // Log per il debug
		setDay(dayValue);

		try {

			const date = new Date(); //ottengo data corrente
			date.setDate(dayValue);
			//console.log("Questo è il mese corrente:", meseCorrente);
			date.setMonth(meseCorrente);
			date.setFullYear(year);
			console.log(date);

			const currentUser = await getCurrentUser();



			const res = await fetch(`${SERVER_API}/events/eventsOfDay`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					date: date.toISOString(),
					owner: currentUser.value.username,
				}),
			});
			const data = await res.json();
			//console.log("Questi sono gli eventi del giorno:", data)

			const eventi = data.value; //ottieni la lista di eventi

			//INIZIO PARTE DI CODICE CHE CALCOLA LE POSIZIONI DEGLI EVENTI PER VISUALIZZAZIONE HTML



			if (eventi && eventi.length > 0) {
				const positions = eventi.map((evento: Event) => {
					if (evento && evento.startTime) {
						const oraInizioEvento = new Date(evento.startTime).getHours();
						const minutiInizioEvento = new Date(evento.startTime).getMinutes();
						const minutiFineEvento = new Date(evento.endTime).getMinutes();
						const oraFineEvento = new Date(evento.endTime).getHours();

						//normalizzo data corrente, data di inizio evento e data di fine evento
						const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
						const eventEndDate = new Date(new Date(evento.endTime).getFullYear(), new Date(evento.endTime).getMonth(), new Date(evento.endTime).getDate()).getTime();
						const eventStartDate = new Date(new Date(evento.startTime).getFullYear(), new Date(evento.startTime).getMonth(), new Date(evento.startTime).getDate()).getTime();



						// Calcola la posizione e l'altezza per ogni evento
						var topPosition = (54 * oraInizioEvento) + (54 * (minutiInizioEvento / 60)); // Posizione inizio evento
						var eventHeight = 54 * (oraFineEvento - oraInizioEvento) + 54 * (minutiFineEvento / 60) - 54 * (minutiInizioEvento / 60); // Altezza dell'evento


						//console.log("Questa è la data corrente:", currentDate);
						//console.log("Questa è la data di inizio evento:", eventStartDate);
						//console.log("Questa è la data di fine evento:", eventEndDate);

						//se la data attuale è inferiore alla data di fine evento, allora estendi l'evento a fino a fine giornata
						if (currentDate < eventEndDate) {
							console.log("L'evento non termina nella data corrente, quindi estendo l'evento fino a fine giornata");
							topPosition = (54 * oraInizioEvento) + (54 * (minutiInizioEvento / 60));
							eventHeight = 54 * (23 - oraInizioEvento) + 54 * ((60 - minutiInizioEvento) / 60);
						}

						//se la data attuale è superiore alla data di inizio evento, e la data corrente è uguale alla data di fine evento
						//allora l'evento inzia in un giorno precedente ad oggi e finisce oggi
						// allora mostro l'evento a partire dall'inizio del giorno e lo faccio finire all'orario di fine evento
						if (currentDate > eventStartDate && currentDate === eventEndDate) {
							console.log("L'evento non inizia nella data corrente ma finisce oggi");
							topPosition = 0; //altezza 0
							eventHeight = (54 * oraFineEvento) + (54 * (minutiFineEvento / 60)); // Altezza dell'evento
						}

						// se l'evento inizia in un giorno precedente ad oggi e finisce in un giorno successivo ad oggi
						if (currentDate > eventStartDate && currentDate < eventEndDate) {
							console.log("L'evento inizia in un giorno precedente ad oggi e finisce in un giorno successivo ad oggi");
							topPosition = 0; //altezza 0
							eventHeight = (54 * 24)
						}


						const nomeEvento = evento.title;
						var tipoEvento = true; //se l'evento è un evento (non un pomodoro), metto type a true
						if (evento.title === "Pomodoro Session") {
							tipoEvento = false; //se l'evento è un pomodoro, metto type a false
						}

						//console.log("stampa l'evento con i propri campi:", evento);
						return { top: topPosition, height: eventHeight, name: nomeEvento, type: tipoEvento, width: 1, marginLeft: 0, event: evento };
					}
					return null; // Ritorna null se l'evento non è valido
				}).filter(Boolean); // Rimuove eventuali null

				//console.log("STAMPO POSITIONS: ", positions);



				// Mappa per tenere traccia delle sovrapposizioni
				const overlapCount: { [key: string]: number } = {};

				// Controlla le sovrapposizioni usando l'array eventi
				eventi.forEach((evento: Event, index: number) => {
					const startTime = new Date(evento.startTime).getTime(); // Tempo di inizio in millisecondi
					const endTime = new Date(evento.endTime).getTime(); // Tempo di fine in millisecondi

					for (let i = 0; i < eventi.length; i++) {
						if (i !== index) {
							const otherEvent = eventi[i];
							const otherStartTime = new Date(otherEvent.startTime).getTime(); // Tempo di inizio dell'altro evento
							const otherEndTime = new Date(otherEvent.endTime).getTime(); // Tempo di fine dell'altro evento

							// Controlla se gli eventi si sovrappongono
							if (startTime < otherEndTime && endTime > otherStartTime) {
								//console.log("Trovato evento con medesimo orario (il primo avviso è sè stesso), iterazione numero " + i);
								// Incrementa il contatore per l'evento corrente
								overlapCount[index] = (overlapCount[index] || 0) + 1;
								// Incrementa il contatore per l'altro evento
								overlapCount[i] = (overlapCount[i] || 0);
							}
						}
					}
				});

				// Aggiorna il parametro width in base al numero di sovrapposizioni
				const finalPositions = positions.map((event: Event, index: number) => {
					const count = (overlapCount[index] || 0) + 1; // Aggiungi 1 per includere l'evento stesso
					return {
						...event,
						//marginLeft: count,
						width: count, // Imposta la larghezza in base al numero di eventi sovrapposti
					};
				});

				//ordino gli eventi dall'alto verso il basso nella visualizzazione (secondo parametro top)
				finalPositions.sort((a: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number; event: Event },
					b: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number, event: Event }) => {
					return a.top - b.top; // Ordina in base al valore di top
				});


				//console.log("POSIZIONI FINALI EVENTI:", finalPositions);

				finalPositions.forEach((position: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number, event: Event }, index: number) => {
					if (index > 0) {
						const previousPosition = finalPositions[index - 1];
						// Controlla se l'evento corrente è sovrapposto al precedente, controllando width
						// (numero eventi sovrapposti) e ora inizio degli eventi (per controllare bug)
						if (position.width === previousPosition.width && position.event.startTime <= previousPosition.event.endTime) {
							// Se sono contigui, calcola il marginLeft

							position.marginLeft = previousPosition.marginLeft + 95 / position.width;
						} else {
							// Altrimenti, non c'è margine
							position.marginLeft = 0;
						}
					} else {
						// Per il primo evento, non c'è margine
						position.marginLeft = 0;
					}
				});



				//FINE PARTE DI CODICE CHE CALCOLA LE POSIZIONI DEGLI EVENTI PER VISUALIZZAZIONE HTML


				setEventPositions(finalPositions);
			}
			else {
				console.log("Nessun evento trovato per questo giorno");
			}
			//console.log("Queste sono le posizioni degli eventi ottenuti:", eventPositions);



		}

		catch (e) {
			console.error("Si è verificato un errore durante il recupero degli eventi del giorno:", e);
		}
	}

	function getStartDayOfWeek(year: number, month: number, day: number): number {
		const date = new Date(year, month, day);
		const dayOfWeek = date.getDay(); // Ottiene il giorno della settimana (0 = Domenica, 1 = Lunedì, ..., 6 = Sabato)

		// Calcola il primo giorno della settimana (Domenica)
		const startDay = day - dayOfWeek;

		return startDay;
	}

	async function loadWeekEvents(startDay: number, year: number, meseCorrente: number): Promise<void> {
		const eventiSettimana = [];

		for (let i = 0; i < 7; i++) {
			let day = startDay + i;
			let currentMonth = meseCorrente;
			let currentYear = year;

			// Gestisci il passaggio al mese successivo
			while (day > getDaysInMonth(new Date(currentYear, currentMonth))) {
				day -= getDaysInMonth(new Date(currentYear, currentMonth));
				currentMonth = (currentMonth + 1) % 12;
				if (currentMonth === 0) {
					currentYear += 1;
				}
			}

			// Gestisci il passaggio al mese precedente
			while (day < 1) {
				currentMonth = (currentMonth - 1 + 12) % 12;
				if (currentMonth === 11) {
					currentYear -= 1;
				}
				day += getDaysInMonth(new Date(currentYear, currentMonth));
			}

			const date = new Date(currentYear, currentMonth, day);

			try {
				const currentUser = await getCurrentUser();
				const res = await fetch(`${SERVER_API}/events/eventsOfDay`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ date: date.toISOString(), owner: currentUser.value.username }),
				});

				if (!res.ok) {
					throw new Error("Errore nella risposta del server");
				}

				const data = await res.json();
				const eventi = data.value;

				if (eventi && eventi.length > 0) {
					const positions = eventi.map((evento: Event) => {
						if (evento && evento.startTime) {
							const oraInizioEvento = new Date(evento.startTime).getHours();
							const minutiInizioEvento = new Date(evento.startTime).getMinutes();
							const minutiFineEvento = new Date(evento.endTime).getMinutes();
							const oraFineEvento = new Date(evento.endTime).getHours();

							//normalizzo data corrente, data di inizio evento e data di fine evento
							const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
							const eventEndDate = new Date(new Date(evento.endTime).getFullYear(), new Date(evento.endTime).getMonth(), new Date(evento.endTime).getDate()).getTime();
							const eventStartDate = new Date(new Date(evento.startTime).getFullYear(), new Date(evento.startTime).getMonth(), new Date(evento.startTime).getDate()).getTime();



							// Calcola la posizione e l'altezza per ogni evento
							var topPosition = (47.3 * oraInizioEvento) + (47.3 * (minutiInizioEvento / 60));  // Posizione inizio evento
							var eventHeight = 47.3 * (oraFineEvento - oraInizioEvento) + 47.3 * (minutiFineEvento / 60) - 47.3 * (minutiInizioEvento / 60); // Altezza dell'evento


							//console.log("Questa è la data corrente:", currentDate);
							//console.log("Questa è la data di inizio evento:", eventStartDate);
							//console.log("Questa è la data di fine evento:", eventEndDate);



							//se la data attuale è inferiore alla data di fine evento, allora estendi l'evento a fino a fine giornata
							if (currentDate < eventEndDate) {

								topPosition = (47.3 * oraInizioEvento) + (47.3 * (minutiInizioEvento / 60));
								eventHeight = 47.3 * (23 - oraInizioEvento) + 47.3 * ((60 - minutiInizioEvento) / 60);
							}

							//se la data attuale è superiore alla data di inizio evento, e la data corrente è uguale alla data di fine evento
							//allora l'evento inzia in un giorno precedente ad oggi e finisce oggi
							// allora mostro l'evento a partire dall'inizio del giorno e lo faccio finire all'orario di fine evento
							if (currentDate > eventStartDate && currentDate === eventEndDate) {
								topPosition = 0; //altezza 0
								eventHeight = (47.3 * oraFineEvento) + (47.3 * (minutiFineEvento / 60)); // Altezza dell'evento
							}

							// se l'evento inizia in un giorno precedente ad oggi e finisce in un giorno successivo ad oggi
							if (currentDate > eventStartDate && currentDate < eventEndDate) {
								topPosition = 0; //altezza 0
								eventHeight = (47.3 * 24)
							}


							const nomeEvento = evento.title;
							const tipoEvento = evento.title !== "Pomodoro Session";

							return { top: topPosition, height: eventHeight, name: nomeEvento, type: tipoEvento, width: 1, marginLeft: 0, event: evento };
						}
						return null;
					}).filter(Boolean);

					// Calcola le sovrapposizioni e aggiorna le posizioni
					const overlapCount: { [key: string]: number } = {};
					eventi.forEach((evento: Event, index: number) => {
						const startTime = new Date(evento.startTime).getTime();
						const endTime = new Date(evento.endTime).getTime();

						for (let j = 0; j < eventi.length; j++) {
							if (j !== index) {
								const otherEvent = eventi[j];
								const otherStartTime = new Date(otherEvent.startTime).getTime();
								const otherEndTime = new Date(otherEvent.endTime).getTime();

								if (startTime < otherEndTime && endTime > otherStartTime) {
									overlapCount[index] = (overlapCount[index] || 0) + 1;
									overlapCount[j] = (overlapCount[j] || 0);
								}
							}
						}
					});

					const finalPositions = positions.map((event: Event, index: number) => {
						const count = (overlapCount[index] || 0) + 1;
						return {
							...event,
							width: count,
						};
					});

					finalPositions.sort((a: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number; event: Event }, b: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number; event: Event }) => a.top - b.top);

					finalPositions.forEach((position: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number; event: Event }, index: number) => {
						if (index > 0) {
							const previousPosition = finalPositions[index - 1];
							if (position.width === previousPosition.width && position.event.startTime <= previousPosition.event.endTime) {
								position.marginLeft = previousPosition.marginLeft + 95 / position.width;
							} else {
								position.marginLeft = 0;
							}
						} else {
							position.marginLeft = 0;
						}
					});

					eventiSettimana.push({ day, positions: finalPositions });
				} else {
					eventiSettimana.push({ day, positions: [] });
				}
			} catch (e) {
				console.error(`Errore durante il recupero degli eventi per il giorno ${day}:`, e);
				eventiSettimana.push({ day, positions: [] });
			}
		}

		// Aggiorna lo stato con gli eventi della settimana
		setWeekEvents(eventiSettimana);
	}

	function handleSelectMode(e: React.ChangeEvent<HTMLSelectElement>): void {
		const value = e.target.value;
		setSelectedMode(value);

		if (value === "1") {
			toggleEventsMode();
		} else if (value === "2") {
			toggleActivitiesMode();
		}

		console.log("Questo è il valore di eventMode:", eventsMode);
		console.log("Questo è il valore di activitiesMode:", activitiesMode);
	}

	async function loadMonthEvents(year: number, meseCorrente: number): Promise<void> {
		const eventiMese = [];
		const daysInMonth = getDaysInMonth(new Date(year, meseCorrente));

		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, meseCorrente, day);

			try {
				const currentUser = await getCurrentUser();
				const res = await fetch(`${SERVER_API}/events/eventsOfDay`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ date: date.toISOString(), owner: currentUser.value.username }),
				});

				if (!res.ok) {
					throw new Error("Errore nella risposta del server");
				}

				const data = await res.json();
				const eventi = data.value;

				if (eventi && eventi.length > 0) {
					const positions = eventi.map((evento: Event) => {
						if (evento && evento.startTime) {
							const oraInizioEvento = new Date(evento.startTime).getHours();
							const minutiInizioEvento = new Date(evento.startTime).getMinutes();
							const minutiFineEvento = new Date(evento.endTime).getMinutes();
							const oraFineEvento = new Date(evento.endTime).getHours();

							const topPosition = (5 * oraInizioEvento) + (5 * (minutiInizioEvento / 60));
							const eventHeight = 5 * (oraFineEvento - oraInizioEvento) + 5 * (minutiFineEvento / 60) - 5 * (minutiInizioEvento / 60);

							const nomeEvento = evento.title;
							const tipoEvento = evento.title !== "Pomodoro Session";

							return { top: topPosition, height: eventHeight, name: nomeEvento, type: tipoEvento, width: 1, marginLeft: 0, event: evento };
						}
						return null;
					}).filter(Boolean);

					// Calcola le sovrapposizioni e aggiorna le posizioni
					const overlapCount: { [key: string]: number } = {};
					eventi.forEach((evento: Event, index: number) => {
						const startTime = new Date(evento.startTime).getTime();
						const endTime = new Date(evento.endTime).getTime();

						for (let j = 0; j < eventi.length; j++) {
							if (j !== index) {
								const otherEvent = eventi[j];
								const otherStartTime = new Date(otherEvent.startTime).getTime();
								const otherEndTime = new Date(otherEvent.endTime).getTime();

								if (startTime < otherEndTime && endTime > otherStartTime) {
									overlapCount[index] = (overlapCount[index] || 0) + 1;
									overlapCount[j] = (overlapCount[j] || 0);
								}
							}
						}
					});

					const finalPositions = positions.map((event: Event, index: number) => {
						const count = (overlapCount[index] || 0) + 1;
						return {
							...event,
							width: count,
						};
					});

					finalPositions.sort((a: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number; event: Event }, b: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number; event: Event }) => a.top - b.top);

					finalPositions.forEach((position: { top: number; height: number; name: string; type: boolean; width: number; marginLeft: number; event: Event }, index: number) => {
						if (index > 0) {
							const previousPosition = finalPositions[index - 1];
							if (position.width === previousPosition.width && position.event.startTime <= previousPosition.event.endTime) {
								position.marginLeft = previousPosition.marginLeft + 95 / position.width;
							} else {
								position.marginLeft = 0;
							}
						} else {
							position.marginLeft = 0;
						}
					});

					eventiMese.push({ day, positions: finalPositions });
				} else {
					eventiMese.push({ day, positions: [] });
				}
			} catch (e) {
				console.error(`Errore durante il recupero degli eventi per il giorno ${day}:`, e);
				eventiMese.push({ day, positions: [] });
			}
		}


		// Aggiorna lo stato con gli eventi del mese
		setMonthEvents(eventiMese);
	}

	function handleSelectUser(
		e: React.ChangeEvent<HTMLSelectElement>,
		username: string
	): void {
		e.preventDefault();
		setUsers([username]);
	}


	async function handleSendInviteActivity(
		e: React.MouseEvent<HTMLButtonElement>
	): Promise<void> {
		e.preventDefault();
		if (!(users.length > 0)) {
			console.log("Nessun utente selezionato");
			return;
		}
		console.log("ENTRO NELLA HANDLESENDINVITE");
		console.log("ENTRO NELLA HANDLESENDINVITE");
		console.log("Questo è il receiver:", users[0]);

		//const currentUser = await getCurrentUser();

		//const ownerr = currentUser.value.username;
		const startTime = new Date(endTime);
		startTime.setHours(endTime.getHours() - 1);
		const idEventoNotificaCondiviso = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

		let newNotification;

		if (addNotification) {
			var notificationDate = new Date(startTime);
			notificationDate.setHours(notificationDate.getHours() + 1); // Aggiungi un'ora
			notificationDate.setMinutes(notificationDate.getMinutes() - notificationTime);
			console.log("Questa è la data di inizio evento:", startTime);
			console.log("Questa è la data della notifica:", notificationDate);
			var message = "";
			if (notificationTime < 60) {
				message = "Scadenza " + title + " tra " + notificationTime + " minuti!";
			} else {
				message = "Scadenza " + title + " tra " + notificationTime / 60 + " ore!";
			}

			if (notificationTime == 0) {
				message = "Scadenza " + title + " iniziata!";
			}

			var repeatTime = notificationRepeatTime;
			var repeatedNotification = false;
			if (repeatTime > 0) {
				repeatedNotification = true;
			}

			newNotification = {
				message: message,
				mode: "activity",
				receiver: users[0],
				type: "activity",
				data: {
					date: notificationDate, //data prima notifica
					idEventoNotificaCondiviso: idEventoNotificaCondiviso, //id condiviso con l'evento, per delete di entrambi
					repeatedNotification: repeatedNotification, //se è true, la notifica si ripete
					repeatTime: repeatTime, //ogni quanti minuti si ripete la notifica, in seguito alla data di prima notifica
					firstNotificationTime: notificationTime, //quanto tempo prima della data di inizio evento si invia la prima notifica
				},

			}

		}




		const newEvent = {
			idEventoNotificaCondiviso,
			owner: users[0],
			title: "Scadenza " + title,
			startTime: startTime.toISOString(),
			endTime: endTime.toISOString(),
			untilDate: null,
			isInfinite: false,
			frequency: "once",
			location,
			repetitions: 1,
		};

		const newActivity = {
			idEventoNotificaCondiviso: idEventoNotificaCondiviso,
			_id: "1",
			title,
			deadline: endTime,
			description,
			owner: users[0],
			accessList: [users[0]],
			completed: false,
		};


		const res3 = await fetch(`${SERVER_API}/notifications`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Hai ricevuto un invito per un'attività",
				mode: "acitvity",
				receiver: users[0],
				type: "message",
				data: {
					date: currentDate, //data prima notifica
					activity: newActivity,
					event: newEvent,
					notification: newNotification,
				},
			}),

		});
		console.log("Notifica creata:", res3);




		const resBody: ResponseBody = (await res3.json()) as ResponseBody;

		if (resBody.status === ResponseStatus.GOOD) {
			//alert("Invito inviato correttamente");
			setUsers([]);
		} else {
			alert(resBody.message);
		}

		toggleCreateActivity();
		setSendInviteActivity(false);
	}

	async function handleSendInviteEvent(
		e: React.MouseEvent<HTMLButtonElement>
	): Promise<void> {
		e.preventDefault();
		if (!(users.length > 0)) {
			console.log("Nessun utente selezionato");
			return;
		}
		console.log("ENTRO NELLA HANDLESENDINVITE");
		console.log("ENTRO NELLA HANDLESENDINVITE");
		console.log("Questo è il receiver:", users[0]);

		//const currentUser = await getCurrentUser();

		//const ownerr = currentUser.value.username;


		const idEventoNotificaCondiviso = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

		let newNotification;

		if (addNotification) {
			const notificationDate = new Date(startTime);
			notificationDate.setMinutes(notificationDate.getMinutes() - notificationTime);
			console.log("Questa è la data di inizio evento:", startTime);
			console.log("Questa è la data della notifica:", notificationDate);
			var message = "";
			if (notificationTime < 60) {
				message = "Inizio evento " + title + " tra " + notificationTime + " minuti!";
			} else {
				message = "Inizio evento " + title + " tra " + notificationTime / 60 + " ore!";
			}

			if (notificationTime == 0) {
				message = "Evento " + title + " iniziato!";
			}

			var repeatTime = notificationRepeatTime;
			var repeatedNotification = false;
			if (repeatTime > 0) {
				repeatedNotification = true;
			}

			newNotification = {
				message: message,
				mode: "event",
				receiver: users[0],
				type: "event",
				data: {
					date: notificationDate, //data prima notifica
					idEventoNotificaCondiviso: idEventoNotificaCondiviso, //id condiviso con l'evento, per delete di entrambi
					repeatedNotification: repeatedNotification, //se è true, la notifica si ripete
					repeatTime: repeatTime, //ogni quanti minuti si ripete la notifica, in seguito alla data di prima notifica
					firstNotificationTime: notificationTime, //quanto tempo prima della data di inizio evento si invia la prima notifica
					frequencyEvent: frequency,
					isInfiniteEvent: isInfinite,
					repetitionsEvent: repetitions,
					untilDateEvent: untilDate,
				},

			}
		}




		const newEvent = {
			idEventoNotificaCondiviso,
			owner: users[0],
			title,
			startTime: startTime.toISOString(),
			endTime: endTime.toISOString(),
			untilDate: untilDate,
			isInfinite,
			frequency: frequency,
			location,
			repetitions,
		};


		const res3 = await fetch(`${SERVER_API}/notifications`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Hai ricevuto un invito per un evento",
				mode: "event",
				receiver: users[0],
				type: "message",
				data: {
					date: currentDate, //data prima notifica
					event: newEvent,
					notification: newNotification,
				},
			}),

		});
		console.log("Notifica creata:", res3);




		const resBody: ResponseBody = (await res3.json()) as ResponseBody;

		if (resBody.status === ResponseStatus.GOOD) {
			//alert("Invito inviato correttamente");
			setUsers([]);
		} else {
			alert(resBody.message);
		}

		toggleCreateEvent();
		setSendInviteEvent(false);


	}

	async function handleAddUserActivity(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		//controlla se users[0] è già contenuta nella accessList
		if (accessList.includes(users[0])) {
			setMessageRisorsa("Utente già presente nell'access list");
			return;
		}
		else {
			setMessageRisorsa("");
		}
		e.preventDefault();
		console.log("Utente ", users[0], " aggiunto all'access list dell'attività");
		setAccessList([...accessList, users[0]]);

	}

	async function handleAddUserEvent(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();
		console.log("Risorsa/utente ", users[0], " da aggiungere all'access list dell'evento");
		const risorsa = users[0];

		//controlla se users[0] è già contenuta nella accessList
		if (accessList.includes(users[0])) {
			setMessageRisorsa("Utente/risorsa già presente nell'access list");
			return;
		}
		else {
			setMessageRisorsa("");
		}

		//controlla che la risorsa aggiunta sia disponibile per l'orario selezionato
		const resRisorsa = await fetch(`${SERVER_API}/risorsa/checkResourceAvailability`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ risorsa, startTime, endTime }),
		});
		const dataRisorsa = await resRisorsa.json();
		if (!dataRisorsa.isAvailable) {
			setMessageRisorsa("Risorsa non disponibile!");
			return;
		}
		else {
			setMessageRisorsa("");
		}

		console.log("La risorsa è disponibile?", dataRisorsa);
		console.log("La risorsa è disponibile?", dataRisorsa);

		console.log("La risorsa è disponibile?", dataRisorsa);

		console.log("La risorsa è disponibile?", dataRisorsa);
		console.log("La risorsa è disponibile?", dataRisorsa);

		console.log("La risorsa è disponibile?", dataRisorsa);

		console.log("La risorsa è disponibile?", dataRisorsa);


		setAccessList([...accessList, users[0]]);
	}

	function toggleShareActivity(): void {
		setShareActivity(!shareActivity);
	}

	function toggleShareEvent(): void {
		setShareEvent(!shareEvent);
	}



	function toggleSendInviteActivity(): void {
		setSendInviteActivity(!sendInviteActivity);
	}

	function toggleSendInviteEvent(): void {
		setSendInviteEvent(!sendInviteEvent);
	}




	async function handleDeleteEvent(id: string, groupId: string): Promise<void> {
		//console.log("day:", day);
		try {
			//console.log("Evento da eliminare:", id);
			const res = await fetch(`${SERVER_API}/events/deleteEvent`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					event_id: id,
					groupId: groupId,
				}),
			});
			const data = await res.json();

			if (data.status === "success") {
				const eventiEliminati = data.value; // Supponendo che `value` contenga gli eventi eliminati

				// Ottieni gli ID degli eventi eliminati
				const idsEliminati = eventiEliminati.map((event: { groupId: string }) => event.groupId);

				// Aggiorna la eventList rimuovendo gli eventi eliminati
				setEventList(prevEventList => prevEventList.filter(event => !idsEliminati.includes(event.groupId)));

				console.log("Event list aggiornata:", eventList);
				handleDateClick(day);
			}


			const res2 = await fetch(`${SERVER_API}/notifications`);
			const data2 = await res2.json();
			const eventiEliminati = data.value;
			const notifications = data2.value; //tutte le notifiche sul database
			console.log("NOTIFICHE RIMASTE IN LISTA:", notifications);
			console.log("Eventi eliminati:", eventiEliminati);

			for (const evento of eventiEliminati) { //per ogni evento in eventi eliminati
				const idEventoNotificaCondiviso = evento.idEventoNotificaCondiviso; // Assicurati che questo campo esista

				// Cerca le notifiche che corrispondono all'idEventoNotificaCondiviso
				const notificationsToDelete = notifications.filter((notification: Notification) => {
					return notification.data.idEventoNotificaCondiviso === idEventoNotificaCondiviso;
				});

				// Elimina le notifiche trovate
				for (const notification of notificationsToDelete) {
					const res3 = await fetch(`${SERVER_API}/notifications/deleteNotification`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ notification_id: notification.id, idEventoNotificaCondiviso: idEventoNotificaCondiviso }), // Assicurati di usare il campo corretto
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

			return data;

		}
		catch (e) {
			setMessage("Errore nell'eliminazione dell'evento: " + e);
			return;
		}

	}

	async function handleDeleteActivity(id: string): Promise<void> {
		//console.log("day:", day);
		try {
			//console.log("Attività da eliminare:", id);
			const res = await fetch(`${SERVER_API}/activity/deleteActivity`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					activity_id: id,
				}),
			});
			const data = await res.json();

			//console.log("EVENTO ELIMINATO:", data);
			//elimina l'evento dalla eventList

			const attivitaEliminata = data.value; // Supponendo che `value` contenga l'attività eliminata

			if (data.status === "success") {

				// Aggiorna la activityList rimuovendo le attività eliminati
				setActivityList(prevActivityList => prevActivityList.filter(activity => activity._id !== attivitaEliminata._id));

				console.log("Activity list aggiornata:", activityList);
				handleDateClick(day);
			}

			//cerca l'evento scadenza dell'attività ed eliminalo
			const res2 = await fetch(`${SERVER_API}/events/deleteEventTitle`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ titoloDaEliminare: "Scadenza " + attivitaEliminata[0].title }),
			});

			const data2 = await res2.json();

			console.log("Evento scadenza eliminato:", data2);

			setEventList(prevEventList =>
				prevEventList.filter(event => event.title !== "Scadenza " + attivitaEliminata[0].title) // Filtra l'evento eliminato
			);
			await loadEvents();

			handleDateClick(day);

			await loadActivities();

			const res3 = await fetch(`${SERVER_API}/notifications`);
			const data3 = await res3.json();
			const notifications = data3.value; //tutte le notifiche sul database
			console.log("NOTIFICHE RIMASTE IN LISTA:", notifications);
			console.log("Attività eliminata:", attivitaEliminata);

			const idEventoNotificaCondiviso = attivitaEliminata[0].idEventoNotificaCondiviso;

			console.log("ID EVENTO NOTIFICA CONDIVISO DELL'ATTIVITA' ELIMINATA:", idEventoNotificaCondiviso);

			for (const notification of notifications) {

				const res3 = await fetch(`${SERVER_API}/notifications/deleteNotification`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ notification_id: notification.id, idEventoNotificaCondiviso: idEventoNotificaCondiviso }), // Assicurati di usare il campo corretto
				});
				console.log("ID NOTIFICA DA ELIMINARE:", notification.id);

				if (!res3.ok) {
					const errorData = await res3.json();
					console.error("Errore durante l'eliminazione della notifica:", errorData);
				} else {
					console.log(`Notifica con ID ${notification.data.idEventoNotificaCondiviso} eliminata con successo.`);
				}
			}
			/*
			POSSIBILE IMPLEMENTAZIONE ELIMINAZIONE EVENTI BY IDEVENTOCONDIVISO
						const res4 = await fetch(`${SERVER_API}/events`);
						const data4 = await res4.json();
						const eventi = data4.value;
						console.log("EVENTI TOTALI IN LISTA:", eventi);
			
						for (const evento of eventi) {
							if (evento.idEventoNotificaCondiviso === idEventoNotificaCondiviso) {
								//console.log("Evento da eliminare:", id);
								const res = await fetch(`${SERVER_API}/events/deleteEvent`, {
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({
										event_id: evento._id,
										groupId: evento.groupId,
									}),
								});
								const data = await res.json();
			
								if (data.status === "success") {
									const eventiEliminati = data.value; // Supponendo che `value` contenga gli eventi eliminati
									console.log("EVENTI ELIMINATI:", eventiEliminati);
			
									// Ottieni gli ID degli eventi eliminati
									const idsEliminati = eventiEliminati.map((event: { groupId: string }) => event.groupId);
			
									// Aggiorna la eventList rimuovendo gli eventi eliminati
									setEventList(prevEventList => prevEventList.filter(event => !idsEliminati.includes(event.groupId)));
			
									console.log("Event list aggiornata:", eventList);
									handleDateClick(day);
								}
							}
						}
							*/

			return data;

		}
		catch (e) {
			setMessage("Errore nell'eliminazione dell'evento: " + e);
			return;
		}

	}

	async function handleCompleteActivity(id: string): Promise<void> {
		console.log("Completo l'attività:", id);
		const res = await fetch(`${SERVER_API}/activity/completeActivity`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				activity_id: id,
			}),
		});
		const data = await res.json();
		//console.log("ATTIVITA COMPLETATA:", data);

		const res2 = await fetch(`${SERVER_API}/activity`); // Assicurati che l'endpoint sia corretto
		const updatedActivities = await res2.json();

		// Aggiorna la activityList con l'elenco aggiornato
		setActivityList(updatedActivities.value);
		await loadActivities();

		const res3 = await fetch(`${SERVER_API}/notifications`);
		const data3 = await res3.json();
		const attivitaCompletata = data.value[0];
		const notifications = data3.value; //tutte le notifiche sul database
		console.log("NOTIFICHE RIMASTE IN LISTAAAA:", notifications);
		console.log("Attività completataAAAA:", attivitaCompletata);
		const idEventoNotificaCondiviso = attivitaCompletata.idEventoNotificaCondiviso;
		console.log("ID CONDIVISO ATTIVITA COMPLETATA:", idEventoNotificaCondiviso);
		console.log("NOTIFICHE ATTUALIIII:", notifications);

		for (const notification of notifications) {

			const res3 = await fetch(`${SERVER_API}/notifications/deleteNotification`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notification_id: notification.id, idEventoNotificaCondiviso: idEventoNotificaCondiviso }), // Assicurati di usare il campo corretto
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



	async function getCurrentUser(): Promise<Promise<any> | null> {
		try {
			const res = await fetch(`${SERVER_API}/users`);
			if (!res.ok) { // Controlla se la risposta non è ok
				setMessage("Utente non autenticato");
				return null; // Restituisci null se non autenticato
			}
			//console.log("Questa è la risposta alla GET per ottenere lo user", res);
			const data: User = await res.json();
			//console.log("Questo è il json della risposta", data);
			return data;
		} catch (e) {
			setMessage("Impossibile recuperare l'utente corrente");
			return null;
		}
	}



	async function handleCreateEvent(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();



		//Validazione dell'input
		if (!title || !startTime || !endTime || !location) {
			setMessage("Tutti i campi dell'evento devono essere riempiti!");
			return;
		}

		//ottieni gli usernames di tutti gli utenti
		const resUsernames = await fetch(`${SERVER_API}/users/allUsernames`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
		const dataUsernames = await resUsernames.json();
		const usernames = dataUsernames.value;

		const risorse = accessList.filter(receiver => !usernames.includes(receiver));

		//controlla che la risorsa aggiunta sia disponibile per l'orario selezionato
		for (const risorsa of risorse) {
			const resRisorsa = await fetch(`${SERVER_API}/risorsa/checkResourceAvailability`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ risorsa, startTime, endTime }),
			});
			const dataRisorsa = await resRisorsa.json();

			console.log("La risorsa è disponibile?", dataRisorsa);
			console.log("La risorsa è disponibile?", dataRisorsa);

			console.log("La risorsa è disponibile?", dataRisorsa);

			console.log("La risorsa è disponibile?", dataRisorsa);
			console.log("La risorsa è disponibile?", dataRisorsa);

			console.log("La risorsa è disponibile?", dataRisorsa);

			console.log("La risorsa è disponibile?", dataRisorsa);



		}


		if (startTime > endTime) {
			setMessage("La data di inizio non può essere collocata dopo la data di fine!");
			return;
		}

		const start = new Date(startTime).getTime();
		const end = new Date(endTime).getTime();

		//l'evento che creo dura almeno 30 minuti?
		if ((end - start) / (1000 * 60) < 30) {
			setMessage("L'evento deve durare almeno 30 minuti");
			return;
		}
		const currentUser = await getCurrentUser();
		console.log("Questo è il currentUser:", currentUser);
		console.log("Questo è il currentUser:", currentUser);
		console.log("Questo è il currentUser:", currentUser);
		console.log("Questo è il currentUser:", currentUser);
		console.log("Questo è il currentUser:", currentUser);


		const owner = currentUser.value.username;

		console.log("Questo è l'owner passato come parametro:", owner);
		console.log("Questo è l'owner passato come parametro:", owner);
		console.log("Questo è l'owner passato come parametro:", owner);
		console.log("Questo è l'owner passato come parametro:", owner);
		console.log("Questo è l'owner passato come parametro:", owner);

		console.log("Questa è la frequenza prima di inviare la richiesta di creazione dell'evento:", frequency);

		//se all'evento è associata una notifica, inserisci idEventoNotificaCondiviso sia nella POST della notifica, che nell'evento
		const idEventoNotificaCondiviso = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
		console.log("ID CONDIVISO EVENTO/NOTIFCA:", idEventoNotificaCondiviso);

		const res = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				idEventoNotificaCondiviso,
				owner,
				title,
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString(),
				accessList: [...new Set([...accessList, owner])],
				accessListAccepted: [owner],
				untilDate: untilDate,
				isInfinite,
				frequency: frequency,
				location,
				repetitions,
			}),
		});



		const notificationDate = new Date(startTime);
		notificationDate.setMinutes(notificationDate.getMinutes() - notificationTime);
		console.log("Questa è la data di inizio evento:", startTime);
		console.log("Questa è la data della notifica:", notificationDate);
		var message = "";
		if (notificationTime < 60) {
			message = "Inizio evento " + title + " tra " + notificationTime + " minuti!";
		} else {
			message = "Inizio evento " + title + " tra " + notificationTime / 60 + " ore!";
		}

		if (notificationTime == 0) {
			message = "Evento " + title + " iniziato!";
		}

		var repeatTime = notificationRepeatTime;
		var repeatedNotification = false;
		if (repeatTime > 0) {
			repeatedNotification = true;
		}



		if (addNotification) {
			console.log("Aggiungo notifica di lunghezza ", notificationTime, " minuti prima per l'evento ", title);
			const res2 = await fetch(`${SERVER_API}/notifications`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: message,
					mode: "event",
					receiver: currentUser.value.username,
					type: "event",
					data: {
						date: notificationDate, //data prima notifica
						idEventoNotificaCondiviso: idEventoNotificaCondiviso, //id condiviso con l'evento, per delete di entrambi
						repeatedNotification: repeatedNotification, //se è true, la notifica si ripete
						repeatTime: repeatTime, //ogni quanti minuti si ripete la notifica, in seguito alla data di prima notifica
						firstNotificationTime: notificationTime, //quanto tempo prima della data di inizio evento si invia la prima notifica
						frequencyEvent: frequency,
						isInfiniteEvent: isInfinite,
						repetitionsEvent: repetitions,
						untilDateEvent: untilDate,
					},
				}),
			});



			const data2 = await res2.json();

			console.log("NOTIFICA AGGIUNTA:", data2);
		}


		const newEvent = {
			owner: owner,
			title: title,
			startTime: startTime.toISOString(),
			endTime: endTime.toISOString(),
			location: location,
			accessList: [...new Set([...accessList, owner])],
			accessListAccepted: [owner],
			idEventoNotificaCondiviso: idEventoNotificaCondiviso,
			isInfinite: isInfinite,
			frequency: frequency,
			untilDate: untilDate,
			repetitions: repetitions,
		}



		console.log("Queste sono le risorse:", risorse);

		//per ogni risorsa, crea un evento risorsa se non è già allocata per quell'orario

		for (const risorsa of risorse) {
			console.log(risorsa);
			const res = await fetch(`${SERVER_API}/events`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					idEventoNotificaCondiviso, //lo inserisco?
					isRisorsa: true,
					owner,
					title: risorsa + " occupata",
					startTime: startTime.toISOString(),
					endTime: endTime.toISOString(),
					accessList: usernames,
					accessListAccepted: usernames,
					untilDate: untilDate,
					isInfinite,
					frequency: frequency,
					location,
					repetitions,
				}),
			});
			console.log("Evento risorsa creato:", res);
		}



		console.log("Questi sono i nomi degli utenti:", usernames);
		//per ogni utente della accessList, invia una notifica per accettare l'invito
		for (const receiver of accessList) {
			if (usernames.includes(receiver)) {
				console.log("Questo è il receiver:", receiver);
				const newNotification = {
					message: message,
					mode: "event",
					receiver: receiver,
					type: "event",
					data: {
						date: notificationDate, //data prima notifica
						idEventoNotificaCondiviso: idEventoNotificaCondiviso, //id condiviso con l'evento, per delete di entrambi
						repeatedNotification: repeatedNotification, //se è true, la notifica si ripete
						repeatTime: repeatTime, //ogni quanti minuti si ripete la notifica, in seguito alla data di prima notifica
						firstNotificationTime: notificationTime, //quanto tempo prima della data di inizio evento si invia la prima notifica
						frequencyEvent: frequency,
						isInfiniteEvent: isInfinite,
						repetitionsEvent: repetitions,
						untilDateEvent: untilDate,
					},
				}
				const res3 = await fetch(`${SERVER_API}/notifications`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						message: message,
						mode: "event",
						receiver: receiver,
						type: "shareEvent",
						data: {
							date: currentDate,
							event: newEvent,
							notification: addNotification ? newNotification : null,

						},
					}),
				});

				console.log("NOTIFICA CONDIVISA:", res3);
			}
		}



		if (!res.ok) {
			const errorData = await res.json();
			console.error("Error response:", errorData);
			setMessage("Errore durante la creazione dell'evento: " + errorData.message);
			return;
		}

		// Aggiorna la lista degli eventi
		await loadEvents();
		handleDateClick(startTime.getDate());

		//setMessage(data.message || "Undefined error");
		setCreateEvent(!createEvent);
		setAllDayEvent(false);
		setAddNotification(false);
		setNotificationTime(0);
		setNotificationRepeatTime(0);
		setShareEvent(false);
		//ripristina l'orario dopo nel pannelo createEvent, dopo aver creato un evento
		const now = new Date();
		const startT = new Date(year, meseCorrente, day, now.getHours(), now.getMinutes());
		const endT = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minuti dopo
		setStartTime(startT);

		setEndTime(endT);
		setRepeatEvent(false);
		setFrequency(Frequency.ONCE);
		setShareEvent(false);
		setAccessList([]);
		setUsers([]);
		setMessageRisorsa("");
		//chiamata alla route per ical
		const res4 = await fetch(`${SERVER_API}/events/ical?owner=${owner}`);
		const data4 = await res4.json();
		console.log("ICAL:", data4);
	}

	async function handleCreateNonDisturbare(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();
		//Validazione dell'input
		if (!startTime || !endTime) {
			setMessage("Tutti i campi dell'evento devono essere riempiti!");
			return;
		}

		if (startTime > endTime) {
			setMessage("La data di inizio non può essere collocata dopo la data di fine!");
			return;
		}

		const start = new Date(startTime).getTime();
		const end = new Date(endTime).getTime();

		//l'evento che creo dura almeno 30 minuti?
		if ((end - start) / (1000 * 60) < 30) {
			setMessage("L'evento deve durare almeno 30 minuti");
			return;
		}
		const currentUser = await getCurrentUser();
		const owner = currentUser.value.username;

		//se all'evento è associata una notifica, inserisci idEventoNotificaCondiviso sia nella POST della notifica, che nell'evento
		const idEventoNotificaCondiviso = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
		console.log("ID CONDIVISO EVENTO/NOTIFCA:", idEventoNotificaCondiviso);

		const res = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				idEventoNotificaCondiviso,
				owner,
				title: "Non disturbare",
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString(),
				untilDate: untilDate,
				isInfinite: isInfinite,
				frequency: frequency,
				location: "Non disturbare",
				repetitions: repetitions,
			}),
		});
		console.log("Non disturbare creato:", res);

		// Aggiorna la lista degli eventi
		await loadEvents();
		handleDateClick(startTime.getDate());

		//setMessage(data.message || "Undefined error");
		setAllDayEvent(false);
		setAddNotification(false);
		setNotificationTime(0);
		setNotificationRepeatTime(0);

		//ripristina l'orario dopo nel pannelo createEvent, dopo aver creato un evento
		const now = new Date();
		const startT = new Date(year, meseCorrente, day, now.getHours(), now.getMinutes());
		const endT = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minuti dopo
		setStartTime(startT);

		setEndTime(endT);
		setRepeatEvent(false);
		setFrequency(Frequency.ONCE);
		setCreateNonDisturbare(!createNonDisturbare);
	}

	async function handleCreateActivity(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();	//Validazione dell'input

		if (!title) {
			setMessage("Il titolo dell'attività deve essere riempito!");
			return;
		}

		const dataInizio = new Date(year, meseCorrente, day);
		if (dataInizio > endTime) {
			setMessage("La data di inizio non può essere collocata dopo la data di fine!");
			return;
		}

		const currentUser = await getCurrentUser();

		const owner = currentUser.value.username;

		const startTime = new Date(endTime);
		startTime.setHours(endTime.getHours() - 1);
		const idEventoNotificaCondiviso = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

		//crea l'attività come evento sul calendario
		const res = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				idEventoNotificaCondiviso,
				owner,
				title: "Scadenza " + title,
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString(),
				untilDate: null,
				isInfinite: false,
				frequency: "once",
				location,
				repetitions: 1,
			}),
		});
		console.log("Evento scadenza creato:", res);



		//crea struttura dati per il body della POST dell'evento
		const newEvent = {
			idEventoNotificaCondiviso,
			owner,
			title: "Scadenza " + title,
			startTime: startTime.toISOString(),
			endTime: endTime.toISOString(),
			untilDate: null,
			isInfinite: false,
			frequency: "once",
			location,
			repetitions: 1,
		};


		const newActivity = {
			idEventoNotificaCondiviso: idEventoNotificaCondiviso,
			_id: "1",
			title,
			deadline: endTime,
			description,
			accessListAccepted: [owner],
			owner: owner,
			accessList: [...new Set([...accessList, owner])],
			completed: false,
		};

		setActivityList([...activityList, newActivity]);


		//crea l'attività nella lista delle attività
		const res2 = await fetch(`${SERVER_API}/activity`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				idEventoNotificaCondiviso,
				title,
				deadline: endTime.toISOString(),
				accessListAccepted: [owner],
				description,
				owner: owner,
				accessList: [...new Set([...accessList, owner])],
			}),
		});
		console.log("Attività creata:", res2);
		await loadActivities();


		var notificationDate = new Date(startTime);
		notificationDate.setHours(notificationDate.getHours() + 1); // Aggiungi un'ora
		notificationDate.setMinutes(notificationDate.getMinutes() - notificationTime);
		console.log("Questa è la data di inizio evento:", startTime);
		console.log("Questa è la data della notifica:", notificationDate);
		var message = "";
		if (notificationTime < 60) {
			message = "Scadenza " + title + " tra " + notificationTime + " minuti!";
		} else {
			message = "Scadenza " + title + " tra " + notificationTime / 60 + " ore!";
		}

		if (notificationTime == 0) {
			message = "Scadenza " + title + " iniziata!";
		}

		var repeatTime = notificationRepeatTime;
		var repeatedNotification = false;
		if (repeatTime > 0) {
			repeatedNotification = true;
		}

		const accessListt = [...new Set([...accessList, owner])];



		//se è stata annessa una notifica all'evento, aggiungo tale notifica al db con una post
		if (addNotification) {
			console.log("Aggiungo notifica di lunghezza ", notificationTime, " minuti prima per l'attività ", title);
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
		}



		//invia ad ogni utente della accessListt una richiesta di accettazione dell'attività (una notifica)
		for (const receiver of accessListt) {


			const newNotification = {
				message: message,
				mode: "activity",
				receiver: receiver,
				type: "activity",
				data: {
					date: notificationDate,
					idEventoNotificaCondiviso: idEventoNotificaCondiviso,
					firstNotificationTime: notificationTime,
					activity: newActivity,
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
							date: currentDate, // data prima notifica
							idEventoNotificaCondiviso: idEventoNotificaCondiviso, // id condiviso con l'evento, per delete di entrambi
							firstNotificationTime: notificationTime, // quanto tempo prima della data di inizio evento si invia la prima notifica
							activity: newActivity, //attività condivisa
							event: newEvent, //evento scadenza dell'attività condivisa
							notification: addNotification ? newNotification : null,
						},
					}),
				});
				console.log("Notifica creata per:", receiver, "Risposta:", res4);
			}
		}


		// Aggiorna la lista degli eventi
		await loadEvents();
		handleDateClick(startTime.getDate());
		//ripristina l'orario dopo nel pannelo createEvent, dopo aver creato un evento
		const now = new Date();
		const startT = new Date(year, meseCorrente, day, now.getHours(), now.getMinutes());
		const endT = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minuti dopo
		setStartTime(startT);
		setEndTime(endT);
		setCreateActivity(!createActivity);
		setAddNotification(false);
		setNotificationTime(0);
		setNotificationRepeatTime(0);
		setSendInviteActivity(false);
		setShareActivity(false);
		setAccessList([]);
		setUsers([]);
		console.log("Questa è la lista delle attività:", activityList);
	}

	async function handleCreateRisorsa(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		const response = await fetch(`${SERVER_API}/risorsa`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: title, description }),
		});
		console.log("Risposta:", response);
		setCreateRisorsa(!createRisorsa);
		setTitle("");
		setDescription("");

	}



	//ottieni il giorno del mese per la visualizzazione weekly
	function getAdjustedDay(day: number, offset: number, year: number, month: number): number {
		let newDay = day + offset;
		let newMonth = month;
		let newYear = year;

		while (newDay > getDaysInMonth(new Date(newYear, newMonth))) {
			newDay -= getDaysInMonth(new Date(newYear, newMonth));
			newMonth = (newMonth + 1) % 12;
			if (newMonth === 0) {
				newYear += 1;
			}
		}

		while (newDay < 1) {
			newMonth = (newMonth - 1 + 12) % 12;
			if (newMonth === 11) {
				newYear -= 1;
			}
			newDay += getDaysInMonth(new Date(newYear, newMonth));
		}

		return newDay;
	}

	function toggleEventTitle(): void {
		if (addTitle) {
			setTitle("Pomodoro Session");
			setAddTitle(false);
		} else {
			setTitle("");
			setAddTitle(true);
		}
	}

	function toggleEventsMode(): void {
		setEventsMode(!eventsMode);
		if (eventsMode) {
			setActivitiesMode(true);
		} else {
			setActivitiesMode(false);
		}
	}

	function toggleActivitiesMode(): void {
		setActivitiesMode(!activitiesMode);
		if (activitiesMode) {
			setEventsMode(true);
		} else {
			setEventsMode(false);
		}
	}


	function toggleAllDayEvent(): void {
		if (!allDayEvent) {
			// Selezionato "Dura tutto il giorno"
			const startOfDay = new Date(startTime);
			startOfDay.setHours(0, 1, 0, 0); // Imposta l'orario a 00:01
			const endOfDay = new Date(endTime);
			endOfDay.setHours(23, 59, 0, 0); // Imposta l'orario a 23:59
			setStartTime(startOfDay);
			setEndTime(endOfDay);
		} else {
			// Deselezionato "Dura tutto il giorno"
			const now = new Date();
			const startTime = new Date(year, meseCorrente, day, now.getHours(), now.getMinutes());
			const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minuti dopo
			setStartTime(startTime);
			setEndTime(endTime);

		}
		setAllDayEvent(!allDayEvent);
	}

	function toggleRepeatEvent(): void {
		console.log("toggleRepeatEvent");
		setRepeatEvent(!repeatEvent);
	}

	function toggleUntil(selectedValue: string): void {
		console.log("toggleUntil", selectedValue);
		setUntil(true);

	}

	function toggleSelectFrequency(e: React.ChangeEvent<HTMLSelectElement>): void {
		console.log("toggleSelectFrequency", e.target.value);
		const frequenza = e.target.value;
		if (frequenza !== "Once") {
			toggleUntil(frequenza);
		}
		if (frequenza === "Once") {
			setFrequency(Frequency.ONCE);
			setUntil(false);
		}
		switch (frequenza) {
			case "Daily":
				setFrequency(Frequency.DAILY);
				break;
			case "Weekly":
				setFrequency(Frequency.WEEKLY);
				break;
			case "Monthly":
				setFrequency(Frequency.MONTHLY);
				break;
			case "Yearly":
				setFrequency(Frequency.YEARLY);
				break;
		}

	}

	function toggleSelectUntil(e: React.ChangeEvent<HTMLSelectElement>): void {
		const valoreSelezionato = e.target.value;
		console.log("toggleSelectUntil", valoreSelezionato);
		switch (valoreSelezionato) {
			case "Data":
				console.log("selezionato data");
				setIsInfinite(false);
				setSelectedValue("Data");

				break;
			case "Ripetizioni":
				console.log("selezionato ripetizioni");
				setIsInfinite(false);
				setSelectedValue("Ripetizioni");
				break;
			case "Infinito":
				console.log("selezionato infinito");
				setSelectedValue("Infinito");
				setIsInfinite(true);
				break;
		}
	}


	return (
		<>
			{message && <div>{message}</div>}
			{day && eventsMode && (
				<div>
					<div style={{ display: "flex", justifyContent: "center" }}>
						<button
							className="btn btn-primary"
							style={{
								backgroundColor: "bisque",
								color: "white",
								border: "0",
								marginLeft: "15px",
							}}
							onClick={dayMode}>
							Day
						</button>
						<button
							className="btn btn-primary"
							style={{
								backgroundColor: "bisque",
								color: "white",
								border: "0",
								marginLeft: "15px",
							}}
							onClick={weekMode}>
							Week
						</button>
						<button
							className="btn btn-primary"
							style={{
								backgroundColor: "bisque",
								color: "white",
								border: "0",
								marginLeft: "15px",
							}}
							onClick={monthMode}>
							Month
						</button>
					</div>
				</div>
			)}

			{activeButton === 0 && (
				<div className="calendar-container row" style={{ marginTop: "2vw" }}>
					<div className="nome-data-container ">
						<div>
							{day} {Mesi[meseCorrente]}
							{year}
							<button
								className="year-button "
								onClick={(): void => {
									setEventPositions([]); // Svuota l'array delle posizioni
									setYear(year - 1); // Decrementa l'anno
								}}>
								-
							</button>
							<button className="year-button" onClick={(): void => {
								setEventPositions([]); // Svuota l'array delle posizioni
								setYear(year + 1); // Decrementa l'anno
							}}>
								+
							</button>
							{activitiesMode && (
								<div>
									<button className="btn btn-primary"
										onClick={toggleTodayActivitiesMode}
										style={{
											backgroundColor: "bisque",
											color: "white",
											border: "0",
											marginLeft: "15px",
										}}>
										Mostra attività che scadono questo giorno
									</button>

									<button className="btn btn-primary"
										onClick={toggleAllActivitiesMode}
										style={{
											backgroundColor: "bisque",
											color: "white",
											border: "0",
											marginLeft: "15px",
										}}>
										Mostra tutte le attività
									</button>
								</div>
							)}
						</div>
					</div>
					<div className="calendar col-4">
						<div
							style={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								marginRight: "5vw",
							}}>
							<button
								className="btn addEvent"
								style={{
									backgroundColor: "bisque",
									color: "black",
									border: "0",
									minWidth: "100px",
									fontSize: "3rem",
									borderRadius: "30%", // Rende il bottone tondo
									padding: "10px", // Aggiungi padding per aumentare la dimensione del bottone
									width: "50px", // Imposta una larghezza fissa
									height: "70px", // Imposta un'altezza fissa
									display: "flex", // Usa flexbox per centrare il contenuto
									alignItems: "center", // Centra verticalmente
									justifyContent: "center", // Centra orizzontalmente
								}}
								onClick={toggleCreate}>

								+
							</button>

							{create && (<div>
								<button className="btn"
									style={{ backgroundColor: "bisque", color: "black", border: "0", margin: "3px" }}
									onClick={toggleCreateEvent}>
									Evento
								</button>
								<button className="btn"
									style={{ backgroundColor: "bisque", color: "black", border: "0", margin: "3px" }}
									onClick={toggleCreateActivity}>
									Attività
								</button>
								<button className="btn"
									style={{ backgroundColor: "bisque", color: "black", border: "0", margin: "3px" }}
									onClick={toggleCreateNonDisturbare}>
									Non disturbare
								</button>
								<button className="btn"
									style={{ backgroundColor: "bisque", color: "black", border: "0", margin: "3px" }}
									onClick={toggleCreateRisorsa}>
									Risorsa
								</button>
							</div>)}


						</div>
						<div
							className="month-indicator"
							style={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
							}}>
							<button
								className="btn btn-primary"
								style={{
									backgroundColor: "bisque",
									color: "black",
									border: "0",
									width: "50px",
									marginRight: "10px",
								}}
								onClick={(): void => {
									mesePrecedente(); /*
								console.log(Mesi[meseCorrente - 1]);
								const date = new Date(year, meseCorrente - 1);
								console.log(getDaysInMonth(date));
								*/
								}
								}>
								{"<<"}
							</button >
							<time style={{ fontSize: "2rem", color: "black" }}>
								{" "}
								{Mesi[meseCorrente]}
							</time>
							<button
								className="btn btn-primary"
								style={{
									backgroundColor: "bisque",
									color: "black",
									border: "0",
									width: "50px",
									marginLeft: "10px",
								}}
								onClick={(): void => {
									meseSuccessivo(); /*
								console.log(Mesi[meseCorrente + 1]);
								const date = new Date(year, meseCorrente + 1);
								console.log(getDaysInMonth(date));
								*/
								}}>
								{">>"}
							</button>
						</div >
						<div className="day-of-week">
							<div>Dom</div>
							<div>Lun</div>
							<div>Mar</div>
							<div>Mer</div>
							<div>Gio</div>
							<div>Ven</div>
							<div>Sab</div>
						</div>
						<div className="date-grid" key={renderKey}>
							{/* Aggiungi spazi vuoti per allineare il primo giorno del mese */}
							{((): JSX.Element[] => {
								return Array.from({
									length: getDay(startOfMonth(new Date(year, meseCorrente))),
								}).map((_, index) => <div key={index}></div>);
							})()}
							{/* Genera i bottoni per i giorni del mese */}
							{Array.from({
								length: getDaysInMonth(new Date(year, meseCorrente)),
							}).map((_, day) => (
								<div key={day + 1} style={{ position: 'relative' }}> {/* Imposta position: relative */}
									<button onClick={handleDateClick}>{day + 1}</button>
									{hasEventsForDay(day + 1) && ( //true se ci sono eventi
										<span style={{
											position: 'absolute', // Posiziona il pallino in modo assoluto
											bottom: '3px', // Posiziona il pallino sotto il bottone
											left: '32%', // Centra orizzontalmente
											transform: 'translateX(-50%)', // Centra il pallino
											width: '8px',
											height: '8px',
											borderRadius: '50%',
											backgroundColor: 'lightgray', // Colore del pallino
										}} />
									)}
								</div>
							))}
						</div>

						<div style={{ marginTop: "10px", display: "flex", justifyContent: "center", alignItems: "center" }}>
							<label htmlFor="eventType" style={{ fontWeight: "bold", marginRight: "10px" }}>Visualizza:</label>
							<select className="btn" id="eventType" style={{
								padding: "10px",
								borderRadius: "5px",
								border: "0",
								backgroundColor: "bisque",
								fontSize: "1rem",
								cursor: "pointer",
								transition: "border-color 0.3s",
							}} onChange={handleSelectMode} value={selectedMode}
							>
								<option value="1">Eventi</option>
								<option value="2">Attività</option>
							</select>
						</div>


						<div style={{ marginTop: "10px", display: "flex", justifyContent: "center", alignItems: "center" }}>
							<button className="btn btn-primary" style={{ backgroundColor: "bisque", color: "black", border: "0" }}
								onClick={handleDownloadCalendar}>Scarica Calendario
							</button>
							<button className="btn btn-primary" style={{ backgroundColor: "bisque", color: "black", border: "0", marginLeft: "20px" }}
								onClick={handleImportCalendar}>Importa Calendario
							</button>


							<div style={{ marginLeft: "20px", maxWidth: "100px" }}>
								<input
									className="btn border"
									style={{ display: "none" }}
									type="file" accept=".ics"
									onChange={handleFileChange}
									id="file-upload" // Aggiungi un ID per il collegamento
								/>
								<label htmlFor="file-upload" className="btn btn-primary border" style={{ backgroundColor: "white", color: "black", border: "0", marginLeft: "20px" }}>
									Scegli file
								</label>
							</div>

							<button className="btn btn-primary" style={{ backgroundColor: "bisque", color: "black", border: "0", marginLeft: "20px" }}
								onClick={toggleShowRisorse}>Visualizza risorse
							</button>



						</div>

					</div >
					{createEvent && (
						<div className="create-event-container col-2">
							<button
								className="btn btn-primary"
								style={{ backgroundColor: "bisque", color: "white", border: "0" }}
								onClick={toggleCreateEvent}>
								Chiudi
							</button>
							<form>
								<label htmlFor="useDefaultTitle">
									<input
										type="checkbox"
										name="useDefaultTitle"
										onClick={toggleEventTitle}
										style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
									/>
									Sessione Pomodoro
								</label>

								<label htmlFor="allDayEvent">
									<input
										type="checkbox"
										name="allDayEvent"
										onClick={toggleAllDayEvent}
										style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
									/>
									Tutto il giorno

								</label>

								<label htmlFor="allDayEvent">
									<input
										type="checkbox"
										name="repeatEvent"
										onClick={toggleRepeatEvent}
										style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
									/>
									Evento ripetuto

								</label>
								{repeatEvent && (
									<>
										<div className="flex" style={{ marginRight: "10px" }}>
											Ripeti l'evento
											<label htmlFor="repeatEvent">
												<select
													className="btn border"
													name="repetitionType"
													onChange={toggleSelectFrequency}
													style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
												>
													<option value="Once">Una volta</option>
													<option value="Daily">Ogni giorno</option>
													<option value="Weekly">Ogni settimana</option>
													<option value="Monthly">Ogni mese </option>
													<option value="Yearly">Ogni anno</option>
												</select>

											</label>
										</div>



										{until && (
											<div>
												<div>
													<div className="flex" style={{ marginRight: "10px" }}>
														Fino a
														<select className="btn border" onChange={toggleSelectUntil} defaultValue="Data">
															<option value="Data">Data</option>
															<option value="Ripetizioni">Ripetizioni</option>
															<option value="Infinito">Infinito </option>
														</select>
													</div>

													{selectedValue === "Data" && (
														<DatePicker
															className="btn border"
															name="finoAData"
															selected={untilDate} // Il DatePicker sarà vuoto se untilDate è null
															onChange={(date: Date | null): void => {
																if (date) {
																	date.setHours(12, 0, 0, 0); // Imposta l'orario a mezzogiorno
																	setUntilDate(date); // Aggiorna lo stato con la nuova data
																}
															}}
															placeholderText="Seleziona una data" // Testo segnaposto quando il DatePicker è vuoto
														/>
													)}



													{selectedValue === "Ripetizioni" && (
														<div>
															<input className="btn border" type="number" min="1"
																onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
																	setRepetitions(Number(e.target.value));
																	//setIsUntilDate(false);
																	setUntilDate(null); // Aggiorna lo stato con la nuova data

																	if (repetitions < 1 || isNaN(repetitions)) {
																		setRepetitions(1);
																	}
																	console.log("Numero ripetizione dell'evento: ", repetitions);
																}}>
															</input>
														</div>
													)}


												</div>
											</div>
										)}
									</>
								)}
								{addTitle && (
									<label htmlFor="title">
										Titolo
										<input
											className="btn border"
											type="text"
											name="title"
											value={title}
											onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
												setTitle(e.target.value)
											}
										/>
									</label>
								)}

								<label htmlFor="startTime">
									Data Inizio
									<div>
										<DatePicker
											className="btn border"
											name="startTime"
											selected={startTime}
											onChange={(date: Date | null): void => {
												if (date) {
													// Aggiorna la data mantenendo l'orario attuale
													const newDate = new Date(startTime);
													newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
													setStartTime(newDate);
												}
											}}
										/>
									</div>
									{!allDayEvent && (
										<>
											<div>
												<input
													className="btn border"
													type="time"
													value={startTime ? `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}` : ""}
													onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
														const [hours, minutes] = e.target.value.split(':');
														if (hours && minutes) { // Controlla se hours e minutes sono definiti
															const newDate = new Date(startTime); // Crea un nuovo oggetto Date basato su startTime
															newDate.setHours(Number(hours), Number(minutes), 0, 0); // Imposta l'orario
															setStartTime(newDate); // Imposta il nuovo oggetto Date
														}
													}}
													onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
														if (e.key === 'Backspace') {
															e.preventDefault(); // Impedisce l'input del tasto backspace
														}
													}}
												/>
											</div>
										</>
									)}
								</label>
								<label htmlFor="endTime">
									Data Fine
									<div>
										<DatePicker
											className="btn border"
											name="endTime"
											selected={endTime}
											onChange={(date: Date | null): void => {
												if (date) {
													// Aggiorna la data mantenendo l'orario attuale
													const newDate = new Date(endTime);
													newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
													setEndTime(newDate);
												}
											}}
										/>
									</div>
									{!allDayEvent && (
										<>
											<div>
												<input
													className="btn border"
													type="time"
													value={`${endTime.getHours().toString().padStart(2, '0')}:${(endTime.getMinutes()).toString().padStart(2, '0')}`}
													onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
														const [hours, minutes] = e.target.value.split(':');
														if (hours && minutes) { // Controlla se hours e minutes sono definiti
															const newDate = new Date(endTime);
															newDate.setHours(Number(hours), Number(minutes)); // Aggiorna l'orario
															setEndTime(newDate); // Imposta il nuovo oggetto Date
														}
													}}
													onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
														if (e.key === 'Backspace') {
															e.preventDefault(); // Impedisce l'input del tasto backspace
														}
													}}
												/>
											</div>
										</>
									)}
								</label>

								<label htmlFor="location">
									Luogo
									<div>
										<input
											className="btn border"
											type="text"
											name="location"
											value={location}
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>
											): void => setLocation(e.target.value)}
										/>
									</div>
								</label>

								<label htmlFor="allDayEvent">
									<input
										type="checkbox"
										name="addNotification"
										onClick={toggleAddNotification}
										style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
									/>
									Aggiungi notifica

								</label>

								{addNotification && (
									<label htmlFor="notificationTime">
										Quanto tempo prima mandare la notifica
										<select
											id="notificationTimeSelect"
											className="btn border"
											onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
												setNotificationTime(Number(e.target.value));
												if (Number(e.target.value) > 0) {
													setNotificationRepeat(true); // Imposta il valore selezionato come notificationTime
												} else if (Number(e.target.value) === 0) {
													setNotificationRepeat(false);
												}
											}}
											style={{ marginLeft: "10px" }} // Aggiungi margine se necessario
										>
											{isInfinite ? (
												<option value="0">All'ora d'inizio</option> // Solo questa opzione se isInfinite è true
											) : (
												<>
													<option value="0">All'ora d'inizio</option>
													<option value="5">5 minuti prima</option>
													<option value="10">10 minuti prima</option>
													<option value="15">15 minuti prima</option>
													<option value="30">30 minuti prima</option>
													<option value="60">1 ora prima</option>
													<option value="120">2 ore prima</option>
													<option value="1440">Un giorno prima</option>
													<option value="2880">2 giorni prima</option>
												</>
											)}
										</select>
									</label>
								)}

								{notificationRepeat && (
									<label htmlFor="notificationRepeatTime">
										Quanto tempo ripetere la notifica
										<select
											className="btn border"
											name="notificationRepeatTime"
											onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
												setNotificationRepeatTime(Number(e.target.value));
											}}
										>
											{getValidRepeatOptions(notificationTime).map(option => (
												<option key={option} value={option}>
													{option === 0
														? "Mai"
														: option >= 60
															? `Ogni ${option / 60} ore` // Se option è maggiore di 60, mostra in ore
															: `Ogni ${option} minuti`}
												</option>
											))}
										</select>
									</label>
								)}

								<label htmlFor="allDayEvent">
									<input
										type="checkbox"

										onClick={toggleSendInviteEvent}
										style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
									/>
									Invia evento ad utente

								</label>

								{sendInviteEvent && (
									<div id="send-invite" className="send-invite-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
										<div>Scegli l'utente al quale inviare la notifica</div>
										{users.length > 0}
										<SearchForm onItemClick={handleSelectUser} list={users} />
										<button
											onClick={handleSendInviteEvent}
											className="btn btn-primary send-invite-button"
											style={{ backgroundColor: "bisque", color: "black", border: "0", marginBottom: "10px" }}
										>
											Invia Invito
										</button>
									</div>
								)}

								<label htmlFor="allDayEvent">
									<input
										type="checkbox"

										onClick={toggleShareEvent}
										style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
									/>
									Condividi evento

								</label>

								{shareEvent && (
									<div id="send-invite" className="send-invite-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
										<div>Scegli l'utente o la risorsa con il quale condividere l'evento</div>
										{users.length > 0}
										<SearchFormResource onItemClick={handleSelectUser} list={users} />
										{messageRisorsa && <div style={{ color: "red", fontWeight: "bold" }}>{messageRisorsa}</div>}
										<button
											onClick={handleAddUserEvent}
											className="btn btn-primary send-invite-button"
											style={{ backgroundColor: "bisque", color: "black", border: "0", marginBottom: "10px" }}
										>
											Condividi
										</button>
									</div>
								)}

								<button
									className="btn btn-primary"
									style={{
										backgroundColor: "bisque",
										color: "white",
										border: "0",
									}}
									onClick={handleCreateEvent}>
									Crea
								</button>
							</form>
						</div>

					)}

					{
						createActivity && (
							<div className="create-event-container col-2">
								<button
									className="btn btn-primary"
									style={{ backgroundColor: "bisque", color: "white", border: "0" }}
									onClick={toggleCreateActivity}>
									Chiudi
								</button>
								<form>
									{addTitle && (
										<label htmlFor="title">
											Title
											<input
												className="btn border"
												type="text"
												name="title"
												value={title}
												onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
													setTitle(e.target.value)
												}
											/>
										</label>
									)}
									<label htmlFor="description">
										Descrizione
										<input
											className="btn border"
											type="text"
											name="title"
											value={description}
											onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
												setDescription(e.target.value)
											}
										/>
									</label>
									<label htmlFor="endTime">
										Scadenza
										<div>
											<DatePicker
												className="btn border"
												name="endTime"
												selected={endTime}
												onChange={(date: Date | null): void => {
													if (date) {
														// Aggiorna la data mantenendo l'orario attuale
														const newDate = new Date(endTime);
														newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
														setEndTime(newDate);
													}
												}}
											/>
										</div>

										<div>
											<input
												className="btn border"
												type="time"
												value={`${endTime.getHours().toString().padStart(2, '0')}:${(endTime.getMinutes()).toString().padStart(2, '0')}`}
												onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
													const [hours, minutes] = e.target.value.split(':');
													const newDate = new Date(endTime);
													newDate.setHours(Number(hours), Number(minutes)); // Aggiorna l'orario
													setEndTime(newDate); // Imposta il nuovo oggetto Date
												}}
												onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
													if (e.key === 'Backspace') {
														e.preventDefault(); // Impedisce l'input del tasto backspace
													}
												}}
											/>
										</div>

									</label>

									<label htmlFor="allDayEvent">
										<input
											type="checkbox"

											onClick={toggleAddNotification}
											style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
										/>
										Aggiungi notifica

									</label>

									{addNotification && (
										<label htmlFor="notificationTime">
											Quanto tempo prima mandare la notifica
											<select
												id="notificationTimeSelect"
												className="btn border"
												onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
													setNotificationTime(Number(e.target.value));
													if (Number(e.target.value) > 0) {
														setNotificationRepeat(true); // Imposta il valore selezionato come notificationTime
													}
													else if (Number(e.target.value) == 0) {
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
												onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
													setNotificationRepeatTime(Number(e.target.value));
												}}
											>
												{getValidRepeatOptions(notificationTime).map(option => (
													<option key={option} value={option}>
														{option === 0
															? "Mai"
															: option >= 60
																? `Ogni ${option / 60} ore` // Se option è maggiore di 60, mostra in ore
																: `Ogni ${option} minuti`}
													</option>
												))}
											</select>
										</label>
									)}

									<label htmlFor="allDayEvent">
										<input
											type="checkbox"
											name="addNotification"
											onClick={toggleSendInviteActivity}
											style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
										/>
										Invia attività ad utente

									</label>

									{sendInviteActivity && (
										<div id="send-invite" className="send-invite-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
											<div>Scegli l'utente al quale inviare la notifica</div>
											{users.length > 0}
											<SearchForm onItemClick={handleSelectUser} list={users} />
											<button
												onClick={handleSendInviteActivity}
												className="btn btn-primary send-invite-button"
												style={{ backgroundColor: "bisque", color: "black", border: "0", marginBottom: "10px" }}
											>
												Invia Invito
											</button>
										</div>
									)}

									<label htmlFor="allDayEvent">
										<input
											type="checkbox"
											name="addNotification"
											onClick={toggleShareActivity}
											style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
										/>
										Condividi attività

									</label>

									{shareActivity && (
										<div id="send-invite" className="send-invite-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
											<div>Scegli l'utente con il quale condividere l'attività</div>
											{users.length > 0}
											<SearchForm onItemClick={handleSelectUser} list={users} />
											<button
												onClick={handleAddUserActivity}
												className="btn btn-primary send-invite-button"
												style={{ backgroundColor: "bisque", color: "black", border: "0", marginBottom: "10px" }}
											>
												Condividi
											</button>
										</div>
									)}

									<button
										className="btn btn-primary"
										style={{
											backgroundColor: "bisque",
											color: "white",
											border: "0",
										}}
										onClick={handleCreateActivity}>
										Crea
									</button>





								</form>
							</div>

						)
					}

					{
						createNonDisturbare && (
							<div className="create-event-container col-2">
								<button
									className="btn btn-primary"
									style={{ backgroundColor: "bisque", color: "white", border: "0" }}
									onClick={toggleCreateNonDisturbare}>
									Chiudi
								</button>
								<form>

									<label htmlFor="allDayEvent">
										<input
											type="checkbox"
											name="allDayEvent"
											onClick={toggleAllDayEvent}
											style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
										/>
										Tutto il giorno

									</label>

									<label htmlFor="allDayEvent">
										<input
											type="checkbox"
											name="repeatEvent"
											onClick={toggleRepeatEvent}
											style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
										/>
										Ripeti

									</label>
									{repeatEvent && (
										<>
											<div className="flex" style={{ marginRight: "10px" }}>
												Ripeti l'evento
												<label htmlFor="repeatEvent">
													<select
														className="btn border"
														name="repetitionType"
														onChange={toggleSelectFrequency}
														style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
													>
														<option value="Once">Una volta</option>
														<option value="Daily">Ogni giorno</option>
														<option value="Weekly">Ogni settimana</option>
														<option value="Monthly">Ogni mese </option>
														<option value="Yearly">Ogni anno</option>
													</select>

												</label>
											</div>



											{until && (
												<div>
													<div>
														<div className="flex" style={{ marginRight: "10px" }}>
															Fino a
															<select className="btn border" onChange={toggleSelectUntil} defaultValue="Data">
																<option value="Data">Data</option>
																<option value="Ripetizioni">Ripetizioni</option>
																<option value="Infinito">Infinito </option>
															</select>
														</div>

														{selectedValue === "Data" && (
															<DatePicker
																className="btn border"
																name="finoAData"
																selected={untilDate} // Il DatePicker sarà vuoto se untilDate è null
																onChange={(date: Date | null): void => {
																	if (date) {
																		date.setHours(12, 0, 0, 0); // Imposta l'orario a mezzogiorno
																		setUntilDate(date); // Aggiorna lo stato con la nuova data
																	}
																}}
																placeholderText="Seleziona una data" // Testo segnaposto quando il DatePicker è vuoto
															/>
														)}



														{selectedValue === "Ripetizioni" && (
															<div>
																<input className="btn border" type="number" min="1"
																	onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
																		setRepetitions(Number(e.target.value));
																		//setIsUntilDate(false);
																		setUntilDate(null); // Aggiorna lo stato con la nuova data

																		if (repetitions < 1 || isNaN(repetitions)) {
																			setRepetitions(1);
																		}
																		console.log("Numero ripetizione dell'evento: ", repetitions);
																	}}>
																</input>
															</div>
														)}


													</div>
												</div>
											)}
										</>
									)}

									<label htmlFor="startTime">
										Data Inizio
										<div>
											<DatePicker
												className="btn border"
												name="startTime"
												selected={startTime}
												onChange={(date: Date | null): void => {
													if (date) {
														// Aggiorna la data mantenendo l'orario attuale
														const newDate = new Date(startTime);
														newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
														setStartTime(newDate);
													}
												}}
											/>
										</div>
										{!allDayEvent && (
											<>
												<div>
													<input
														className="btn border"
														type="time"
														value={startTime ? `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}` : ""}
														onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
															const [hours, minutes] = e.target.value.split(':');
															if (hours && minutes) { // Controlla se hours e minutes sono definiti
																const newDate = new Date(startTime); // Crea un nuovo oggetto Date basato su startTime
																newDate.setHours(Number(hours), Number(minutes), 0, 0); // Imposta l'orario
																setStartTime(newDate); // Imposta il nuovo oggetto Date
															}
														}}
														onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
															if (e.key === 'Backspace') {
																e.preventDefault(); // Impedisce l'input del tasto backspace
															}
														}}
													/>
												</div>
											</>
										)}
									</label>
									<label htmlFor="endTime">
										Data Fine
										<div>
											<DatePicker
												className="btn border"
												name="endTime"
												selected={endTime}
												onChange={(date: Date | null): void => {
													if (date) {
														// Aggiorna la data mantenendo l'orario attuale
														const newDate = new Date(endTime);
														newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
														setEndTime(newDate);
													}
												}}
											/>
										</div>
										{!allDayEvent && (
											<>
												<div>
													<input
														className="btn border"
														type="time"
														value={`${endTime.getHours().toString().padStart(2, '0')}:${(endTime.getMinutes()).toString().padStart(2, '0')}`}
														onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
															const [hours, minutes] = e.target.value.split(':');
															if (hours && minutes) { // Controlla se hours e minutes sono definiti
																const newDate = new Date(endTime);
																newDate.setHours(Number(hours), Number(minutes)); // Aggiorna l'orario
																setEndTime(newDate); // Imposta il nuovo oggetto Date
															}
														}}
														onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
															if (e.key === 'Backspace') {
																e.preventDefault(); // Impedisce l'input del tasto backspace
															}
														}}
													/>
												</div>
											</>
										)}
									</label>

									<button
										className="btn btn-primary"
										style={{
											backgroundColor: "bisque",
											color: "white",
											border: "0",
										}}
										onClick={handleCreateNonDisturbare}>
										Crea
									</button>
								</form>
							</div>

						)
					}

					{
						createRisorsa && (
							<div className="create-event-container col-2">
								<button
									className="btn btn-primary"
									style={{ backgroundColor: "bisque", color: "white", border: "0" }}
									onClick={toggleCreateRisorsa}>
									Chiudi
								</button>
								<form>

									<label htmlFor="title">
										Nome
										<input
											className="btn border"
											type="text"
											name="title"
											value={title}
											onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
												setTitle(e.target.value)
											}
										/>
									</label>

									<label htmlFor="description">
										Descrizione
										<input
											className="btn border"
											type="text"
											name="title"
											value={description}
											onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
												setDescription(e.target.value)
											}
										/>
									</label>
									<button
										className="btn btn-primary"
										style={{
											backgroundColor: "bisque",
											color: "white",
											border: "0",
										}}
										onClick={handleCreateRisorsa}>
										Crea
									</button>
								</form>
							</div>

						)
					}

					{
						activitiesMode && todayActivitiesMode && (
							<>
								<div className="orario col-5" style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }} key={renderKey}>
									{activitiesCheScadonoOggi.length > 0 ? (
										activitiesCheScadonoOggi.map((activity, index) => (
											<div key={index} style={{ margin: "5px", padding: "10px", border: "1px solid #ccc", borderRadius: "10px", width: "100%" }}>
												<h4>{activity.title}</h4>
												<p>Scadenza: {new Date(activity.deadline).toLocaleString()}</p>
												<p>Descrizione: {activity.description}</p>
												<span style={{ color: "black", marginBottom: "10px" }}>
													Completata:
													<span style={{ color: activity.completed ? "lightgreen" : "lightcoral" }}>
														{activity.completed ? " Si" : " No"}
													</span>


													{new Date(activity.deadline) < currentDate && !activity.completed && (
														<p style={{ color: "red", fontWeight: "bold" }}>ATTIVITÀ IN RITARDO</p>
													)}

												</span>
												<br />
												<button onClick={async (): Promise<void> => {
													await handleDeleteActivity(activity._id); // Chiama la funzione di eliminazione
													// Dopo l'eliminazione, aggiorna la lista delle attività
													setActivityList(prevList => prevList.filter(a => a._id !== activity._id));
												}} className="btn btn-primary" style={{ backgroundColor: "bisque", marginRight: "10px", color: "white", border: "0", padding: "5px 5px 5px 5px" }}>
													<i style={{ color: "black" }} className="bi bi-trash"> </i>
												</button>

												<button onClick={async (): Promise<void> => {
													await handleCompleteActivity(activity._id); //completo l'attività corrente
												}} className="btn btn-primary" style={{ backgroundColor: "bisque", color: "white", border: "0", padding: "5px 5px 5px 5px" }}>
													<i style={{ color: "black" }} className="bi bi-check"> </i>
												</button>

											</div>

										))
									) : (
										<p style={{ color: "black", textAlign: "center", justifyContent: "center", marginTop: "16vw", fontWeight: "bold" }}>Non ci sono attività in scadenza oggi.</p>
									)}
								</div>
							</>

						)
					}

					{
						activitiesMode && allActivitiesMode && (
							<>
								<div className="orario col-5" style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }} key={renderKey}>
									{activityList.length > 0 ? (
										activityList.map((activity, index) => (
											<div key={index} style={{ margin: "5px", padding: "10px", border: "1px solid #ccc", borderRadius: "10px", width: "100%" }}>
												<h4>{activity.title}</h4>
												<p>Scadenza: {new Date(activity.deadline).toLocaleString()}</p>
												<p>Descrizione: {activity.description}</p>
												<span style={{ color: "black", marginBottom: "10px" }}>
													Completata:
													<span style={{ color: activity.completed ? "lightgreen" : "lightcoral" }}>
														{activity.completed ? " Si" : " No"}
													</span>
												</span>

												{new Date(activity.deadline) < currentDate && !activity.completed && (
													<p style={{ color: "red", fontWeight: "bold" }}>ATTIVITÀ IN RITARDO</p>
												)}

												<br />
												<button onClick={async (): Promise<void> => {
													await handleDeleteActivity(activity._id); // Chiama la funzione di eliminazione
													// Dopo l'eliminazione, aggiorna la lista delle attività
													setActivityList(prevList => prevList.filter(a => a._id !== activity._id));
												}} className="btn btn-primary" style={{ backgroundColor: "bisque", marginRight: "10px", color: "white", border: "0", padding: "5px 5px 5px 5px" }}>
													<i style={{ color: "black" }} className="bi bi-trash"> </i>
												</button>

												<button onClick={async (): Promise<void> => {
													await handleCompleteActivity(activity._id); //completo l'attività corrente
												}} className="btn btn-primary" style={{ backgroundColor: "bisque", color: "white", border: "0", padding: "5px 5px 5px 5px" }}>
													<i style={{ color: "black" }} className="bi bi-check"> </i>
												</button>

											</div>

										))
									) : (
										<p style={{ color: "black", textAlign: "center", justifyContent: "center", marginTop: "16vw", fontWeight: "bold", }}>Non ci sono attività in scadenza.</p>
									)}
								</div>
							</>

						)
					}


					{
						eventsMode && (
							<div className="orario col-5" >


								<div style={{ position: "relative", marginLeft: "10%" }}>
									{eventPositions.map((event, index) => (
										// Se event.type è true, rendi il div cliccabile, altrimenti mostra solo il div
										!event.type ? (

											<div
												key={index} // Assicurati di fornire una chiave unica per ogni elemento
												className="evento red"
												style={{
													top: `${event.top}px`, // Imposta la posizione verticale
													height: `${event.height}px`, // Imposta l'altezza dell'evento
													width: `calc(95%/${event.width})`,
													position: "absolute", // Assicurati che sia posizionato correttamente
													color: (new Date(currentDate) > new Date(event.event.endTime) ? "rgba(209, 150, 150, 1)" : "red"), // Colore più chiaro se currentDate è maggiore di endTime
													borderColor: (new Date(currentDate) > new Date(event.event.endTime) ? "rgba(209, 150, 150, 1)" : "red"),
													backgroundColor: (new Date(currentDate) > new Date(event.event.endTime) ? "rgba(249, 67, 67, 0.2)" : "rgba(249, 67, 67, 0.5)"), // Colore di sfondo più chiaro
													marginLeft: `${event.marginLeft}%`,
													cursor: "default", // Imposta il cursore di default per l'intero evento
												}}
											>
												<div style={{ color: "red" }}>
													<Link
														to={`/pomodoro?duration=${
															// Funzione per calcolare la durata dell'evento e scriverlo come query param
															((startTime, endTime): number => {
																const start = new Date(startTime);
																const end = new Date(endTime);
																const totMin = Math.max((end.getTime() - start.getTime()) / (1000 * 60), 0);
																return totMin;
															})(event.event.startTime, event.event.endTime) // Passa startTime e endTime
															}&id=${event.event._id}`} // Passa l'id dell'evento
														style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
													>
														{event.name}
													</Link>
												</div>
												<div className="position-relative" onClick={(): Promise<void> => handleDeleteEvent(event.event._id, event.event.groupId)}>
													{/* Questo div ha una posizione relativa per consentire il posizionamento assoluto dell'icona */}
													<i className="bi bi-trash"
														style={{
															bottom: "2px", // Posiziona l'icona a 10px dal fondo
															right: "50%",  // Posiziona l'icona a 10px dal lato destro
															fontSize: "1.5rem",
															margin: 0,
															padding: 0,
															color: "red",
															cursor: "pointer"
														}}
													></i>
												</div>
											</div>

										) : ((!event.event.isRisorsa || (event.event.isRisorsa && showRisorse)) && (
											<div
												className={`evento ${event.event.title === "Non disturbare" ? "non-disturbare" : event.event.isRisorsa ? "brown" : "blue"}`}
												style={{
													top: `${event.top}px`, // Imposta la posizione verticale
													height: `${event.height}px`, // Imposta l'altezza dell'evento
													width: `calc(95%/${event.width})`,
													position: "absolute", // Assicurati che sia posizionato correttamente
													color: event.event.title === "Non disturbare" ? "rgba(128, 138, 136, 1)" : (event.event.isRisorsa ? "rgba(166, 93, 41, 0.48)" : (new Date(currentDate) > new Date(event.event.endTime) ? "rgba(135, 190, 196, 0.8)" : "rgb(155, 223, 212)")),
													borderColor: event.event.title === "Non disturbare" ? "white" : (event.event.isRisorsa ? "rgba(166, 93, 41, 0.48)" : (new Date(currentDate) > new Date(event.event.endTime) ? "rgba(135, 190, 196, 0.8)" : "rgb(155, 223, 212)")),
													backgroundColor: event.event.title === "Non disturbare" ? (new Date(currentDate) > new Date(event.event.endTime) ? "rgba(128, 138, 136, 0.2)" : "rgba(128, 138, 136, 0.4)") : (event.event.isRisorsa ? (new Date(currentDate) > new Date(event.event.endTime) ? "rgba(139, 69, 19, 0.2)" : "rgba(139, 69, 19, 0.5)") : (new Date(currentDate) > new Date(event.event.endTime) ? "rgba(155, 223, 212, 0.2)" : "rgba(155, 223, 212, 0.5)")),
													marginLeft: `${event.marginLeft}%`,
													cursor: "default",
												}}
											>
												{event.name}
												<div className="position-relative" onClick={(): Promise<void> => handleDeleteEvent(event.event._id, event.event.groupId)}>
													{/* Questo div ha una posizione relativa per consentire il posizionamento assoluto dell'icona */}
													{(!event.event.isRisorsa || (event.event.isRisorsa && isAdmin)) && (
														<i className="bi bi-trash"
															style={{
																bottom: "2px", // Posiziona l'icona a 10px dal fondo
																right: "50%",  // Posiziona l'icona a 10px dal lato destro
																fontSize: "1.5rem",
																margin: 0,
																padding: 0,
																color: event.event.title === "Non disturbare" ? "rgba(128, 138, 136, 1)" : (event.event.isRisorsa ? "rgba(166, 93, 41, 0.48)" : (new Date(currentDate) > new Date(event.event.endTime) ? "rgba(135, 190, 196, 0.8)" : "rgb(155, 223, 212)")),
																cursor: "pointer"
															}}
														></i>
													)}
												</div>

											</div>
										)

										)

									)

									)}
								</div >


								<time>00:00</time>
								<time>01:00</time>
								<time>02:00</time>
								<time>03:00</time>
								<time>04:00</time>
								<time>05:00</time>
								<time>06:00</time>
								<time>07:00</time>
								<time>08:00</time>
								<time>09:00</time>
								<time>10:00</time>
								<time>11:00</time>
								<time>12:00</time>
								<time>13:00</time>
								<time>14:00</time>
								<time>15:00</time>
								<time>16:00</time>
								<time>17:00</time>
								<time>18:00</time>
								<time>19:00</time>
								<time>20:00</time>
								<time>21:00</time>
								<time>22:00</time>
								<time>23:00</time>

							</div >
						)
					}
				</div >
			)
			}

			{
				activeButton === 1 && (
					<div>
						<div
							className="nome-data-week"
							style={{ display: "flex", justifyContent: "center", marginTop: "2vw" }}>
							<button
								className="btn btn-primary"
								style={{
									backgroundColor: "bisque",
									color: "black",
									border: "0",
									width: "50px",
									marginRight: "10px",
								}}
								onClick={prevWeek}>
								{"<<"}
							</button>
							<div>
								{Mesi[meseCorrente]} {year}{" "}
							</div>
							<button
								className="btn btn-primary"
								style={{
									backgroundColor: "bisque",
									color: "black",
									border: "0",
									width: "50px",
									marginLeft: "10px",
								}}
								onClick={nextWeek}>
								{">>"}
							</button>
						</div>

						<div className="row" style={{ display: "flex", justifyContent: "center" }}>
							<div className="col-12">
								{((): JSX.Element | null => {
									//const dayOfWeek = getDay(new Date(year, meseCorrente, day));
									//console.log(dayOfWeek);
									return null;
								})()}
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										maxWidth: "95%",
										marginLeft: "auto",
										marginRight: "auto",
										marginTop: "1vw",
									}}>
									<div className="nome-data-week">
										<div
											style={{
												color: "gray",
												width: "100%",
												fontWeight: 500,
												fontSize: "0.6em",
												letterSpacing: "0.1em",
												fontVariant: "small-caps",
											}}>
											Dom{" "}
											{((): JSX.Element | null => {
												const currentDayOfWeek = getDay(new Date(year, meseCorrente, day));



												return (
													<>
														{currentDayOfWeek === 5 && getAdjustedDay(day, -5, year, meseCorrente)}
														{currentDayOfWeek === 4 && getAdjustedDay(day, -4, year, meseCorrente)}
														{currentDayOfWeek === 3 && getAdjustedDay(day, -3, year, meseCorrente)}
														{currentDayOfWeek === 2 && getAdjustedDay(day, -2, year, meseCorrente)}
														{currentDayOfWeek === 1 && getAdjustedDay(day, -1, year, meseCorrente)}
														{currentDayOfWeek === 0 && getAdjustedDay(day, 0, year, meseCorrente)}
													</>
												);
											})()}

										</div>
										<div
											className="orario"
											style={{
												fontSize: "0.8vw",
												width: "95%",
												flex: "1",
												position: "relative",
												overflowY: "auto",
											}}
											onWheel={handleScroll}>

											{renderWeekEvents(weekEvents, 0)}

											{/*{renderMonthEvents(monthEvents, 12)}
											RENDERIZZA GLI EVENTI DEL GIORNO 12+1 = 13*/}



											<time>00:00</time>
											<time>01:00</time>
											<time>02:00</time>
											<time>03:00</time>
											<time>04:00</time>
											<time>05:00</time>
											<time>06:00</time>
											<time>07:00</time>
											<time>08:00</time>
											<time>09:00</time>
											<time>10:00</time>
											<time>11:00</time>
											<time>12:00</time>
											<time>13:00</time>
											<time>14:00</time>
											<time>15:00</time>
											<time>16:00</time>
											<time>17:00</time>
											<time>18:00</time>
											<time>19:00</time>
											<time>20:00</time>
											<time>21:00</time>
											<time>22:00</time>
											<time>23:00</time>

										</div>
									</div>
									<div className="nome-data-week">
										<div
											style={{
												color: "gray",
												fontWeight: 500,
												fontSize: "0.6em",
												letterSpacing: "0.1em",
												fontVariant: "small-caps",
											}}>
											Lun{" "}


											{getDay(new Date(year, meseCorrente, day)) === 6 &&
												getAdjustedDay(day, -5, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 5 &&
												getAdjustedDay(day, -4, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 4 &&
												getAdjustedDay(day, -3, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 3 &&
												getAdjustedDay(day, -2, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 2 &&
												getAdjustedDay(day, -1, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 1 &&
												getAdjustedDay(day, 0, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 0 &&
												getAdjustedDay(day, 1, year, meseCorrente)}
										</div>

										<div
											className="orario"
											style={{
												fontSize: "0.8vw",
												width: "calc(100% - 10px)",
												flex: "1",
											}}
											onWheel={handleScroll}>

											{renderWeekEvents(weekEvents, 1)}


											<time>00:00</time>
											<time>01:00</time>
											<time>02:00</time>
											<time>03:00</time>
											<time>04:00</time>
											<time>05:00</time>
											<time>06:00</time>
											<time>07:00</time>
											<time>08:00</time>
											<time>09:00</time>
											<time>10:00</time>
											<time>11:00</time>
											<time>12:00</time>
											<time>13:00</time>
											<time>14:00</time>
											<time>15:00</time>
											<time>16:00</time>
											<time>17:00</time>
											<time>18:00</time>
											<time>19:00</time>
											<time>20:00</time>
											<time>21:00</time>
											<time>22:00</time>
											<time>23:00</time>

										</div>
									</div>
									<div className="nome-data-week">
										<div
											style={{
												color: "gray",
												fontWeight: 500,
												fontSize: "0.6em",
												letterSpacing: "0.1em",
												fontVariant: "small-caps",
											}}>
											Mar{" "}
											{getDay(new Date(year, meseCorrente, day)) === 6 &&
												getAdjustedDay(day, -4, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 5 &&
												getAdjustedDay(day, -3, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 4 &&
												getAdjustedDay(day, -2, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 3 &&
												getAdjustedDay(day, -1, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 2 &&
												getAdjustedDay(day, 0, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 1 &&
												getAdjustedDay(day, 1, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 0 &&
												getAdjustedDay(day, 2, year, meseCorrente)}
										</div>
										<div
											className="orario"
											style={{
												fontSize: "0.8vw",
												width: "calc(100% - 10px)",
												flex: "1",
											}}
											onWheel={handleScroll}>


											{renderWeekEvents(weekEvents, 2)}
											<time>00:00</time>
											<time>01:00</time>
											<time>02:00</time>
											<time>03:00</time>
											<time>04:00</time>
											<time>05:00</time>
											<time>06:00</time>
											<time>07:00</time>
											<time>08:00</time>
											<time>09:00</time>
											<time>10:00</time>
											<time>11:00</time>
											<time>12:00</time>
											<time>13:00</time>
											<time>14:00</time>
											<time>15:00</time>
											<time>16:00</time>
											<time>17:00</time>
											<time>18:00</time>
											<time>19:00</time>
											<time>20:00</time>
											<time>21:00</time>
											<time>22:00</time>
											<time>23:00</time>

										</div>
									</div>
									<div className="nome-data-week">
										<div
											style={{
												color: "gray",
												fontWeight: 500,
												fontSize: "0.6em",
												letterSpacing: "0.1em",
												fontVariant: "small-caps",
											}}>
											Mer{" "}
											{getDay(new Date(year, meseCorrente, day)) === 6 &&
												getAdjustedDay(day, -3, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 5 &&
												getAdjustedDay(day, -2, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 4 &&
												getAdjustedDay(day, -1, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 3 &&
												getAdjustedDay(day, 0, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 2 &&
												getAdjustedDay(day, 1, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 1 &&
												getAdjustedDay(day, 2, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 0 &&
												getAdjustedDay(day, 3, year, meseCorrente)}
										</div>
										<div
											className="orario"
											style={{
												fontSize: "0.8vw",
												width: "calc(100% - 10px)",
												flex: "1",
											}}
											onWheel={handleScroll}>

											{renderWeekEvents(weekEvents, 3)}
											<time>00:00</time>
											<time>01:00</time>
											<time>02:00</time>
											<time>03:00</time>
											<time>04:00</time>
											<time>05:00</time>
											<time>06:00</time>
											<time>07:00</time>
											<time>08:00</time>
											<time>09:00</time>
											<time>10:00</time>
											<time>11:00</time>
											<time>12:00</time>
											<time>13:00</time>
											<time>14:00</time>
											<time>15:00</time>
											<time>16:00</time>
											<time>17:00</time>
											<time>18:00</time>
											<time>19:00</time>
											<time>20:00</time>
											<time>21:00</time>
											<time>22:00</time>
											<time>23:00</time>

										</div>
									</div>
									<div className="nome-data-week">
										<div
											style={{
												color: "gray",
												fontWeight: 500,
												fontSize: "0.6em",
												letterSpacing: "0.1em",
												fontVariant: "small-caps",
											}}>
											Gio{" "}
											{getDay(new Date(year, meseCorrente, day)) === 6 &&
												getAdjustedDay(day, -2, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 5 &&
												getAdjustedDay(day, -1, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 4 &&
												getAdjustedDay(day, 0, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 3 &&
												getAdjustedDay(day, 1, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 2 &&
												getAdjustedDay(day, 2, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 1 &&
												getAdjustedDay(day, 3, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 0 &&
												getAdjustedDay(day, 4, year, meseCorrente)}
										</div>
										<div
											className="orario"
											style={{
												fontSize: "0.8vw",
												width: "calc(100% - 10px)",
												flex: "1",
											}}
											onWheel={handleScroll}>

											{renderWeekEvents(weekEvents, 4)}
											<time>00:00</time>
											<time>01:00</time>
											<time>02:00</time>
											<time>03:00</time>
											<time>04:00</time>
											<time>05:00</time>
											<time>06:00</time>
											<time>07:00</time>
											<time>08:00</time>
											<time>09:00</time>
											<time>10:00</time>
											<time>11:00</time>
											<time>12:00</time>
											<time>13:00</time>
											<time>14:00</time>
											<time>15:00</time>
											<time>16:00</time>
											<time>17:00</time>
											<time>18:00</time>
											<time>19:00</time>
											<time>20:00</time>
											<time>21:00</time>
											<time>22:00</time>
											<time>23:00</time>

										</div>
									</div>
									<div className="nome-data-week">
										<div
											style={{
												color: "gray",
												fontWeight: 500,
												fontSize: "0.6em",
												letterSpacing: "0.1em",
												fontVariant: "small-caps",
											}}>
											Ven{" "}
											{getDay(new Date(year, meseCorrente, day)) === 6 &&
												getAdjustedDay(day, -1, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 5 &&
												getAdjustedDay(day, 0, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 4 &&
												getAdjustedDay(day, 1, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 3 &&
												getAdjustedDay(day, 2, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 2 &&
												getAdjustedDay(day, 3, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 1 &&
												getAdjustedDay(day, 4, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 0 &&
												getAdjustedDay(day, 5, year, meseCorrente)}
										</div>
										<div
											className="orario"
											style={{
												fontSize: "0.8vw",
												width: "calc(100% - 10px)",
												flex: "1",
											}}
											onWheel={handleScroll}>

											{renderWeekEvents(weekEvents, 5)}
											<time>00:00</time>
											<time>01:00</time>
											<time>02:00</time>
											<time>03:00</time>
											<time>04:00</time>
											<time>05:00</time>
											<time>06:00</time>
											<time>07:00</time>
											<time>08:00</time>
											<time>09:00</time>
											<time>10:00</time>
											<time>11:00</time>
											<time>12:00</time>
											<time>13:00</time>
											<time>14:00</time>
											<time>15:00</time>
											<time>16:00</time>
											<time>17:00</time>
											<time>18:00</time>
											<time>19:00</time>
											<time>20:00</time>
											<time>21:00</time>
											<time>22:00</time>
											<time>23:00</time>

										</div>
									</div>
									<div className="nome-data-week">
										<div
											style={{
												color: "gray",
												fontWeight: 500,
												fontSize: "0.6em",
												letterSpacing: "0.1em",
												fontVariant: "small-caps",
											}}>
											Sab{" "}
											{getDay(new Date(year, meseCorrente, day)) === 6 &&
												getAdjustedDay(day, 0, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 5 &&
												getAdjustedDay(day, 1, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 4 &&
												getAdjustedDay(day, 2, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 3 &&
												getAdjustedDay(day, 3, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 2 &&
												getAdjustedDay(day, 4, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 1 &&
												getAdjustedDay(day, 5, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 0 &&
												getAdjustedDay(day, 6, year, meseCorrente)}
										</div>
										<div
											className="orario"
											style={{
												fontSize: "0.8vw",
												width: "calc(100% - 10px)",
												flex: "1",
											}}
											onWheel={handleScroll}>

											{renderWeekEvents(weekEvents, 6)}
											<time>00:00</time>
											<time>01:00</time>
											<time>02:00</time>
											<time>03:00</time>
											<time>04:00</time>
											<time>05:00</time>
											<time>06:00</time>
											<time>07:00</time>
											<time>08:00</time>
											<time>09:00</time>
											<time>10:00</time>
											<time>11:00</time>
											<time>12:00</time>
											<time>13:00</time>
											<time>14:00</time>
											<time>15:00</time>
											<time>16:00</time>
											<time>17:00</time>
											<time>18:00</time>
											<time>19:00</time>
											<time>20:00</time>
											<time>21:00</time>
											<time>22:00</time>
											<time>23:00</time>

										</div>
									</div>
								</div>
							</div>
						</div >
					</div >
				)
			}
			{
				activeButton === 2 && (
					<div style={{ marginTop: "2vw" }}>
						<div
							className="nome-data-week"
							style={{ display: "flex", justifyContent: "center", marginTop: "2vw" }}>
							<button
								className="btn btn-primary"
								style={{
									backgroundColor: "bisque",
									color: "black",
									border: "0",
									width: "50px",
									marginRight: "10px",
								}}
								onClick={mesePrecedente}>
								{"<<"}
							</button>
							<div>
								{Mesi[meseCorrente]} {year}{" "}
							</div>
							<button
								className="btn btn-primary"
								style={{
									backgroundColor: "bisque",
									color: "black",
									border: "0",
									width: "50px",
									marginLeft: "10px",
								}}
								onClick={meseSuccessivo}>
								{">>"}
							</button>
						</div>
						<div className="calendar col-11">
							<div className="day-of-week" style={{ fontSize: "1.5vw" }}>
								<div>Dom</div>
								<div>Lun</div>
								<div>Mar</div>
								<div>Mer</div>
								<div>Gio</div>
								<div>Ven</div>
								<div>Sab</div>
							</div>
							<div className="date-grid">
								{/* Aggiungi spazi vuoti per allineare il primo giorno del mese */}
								{((): JSX.Element[] => {
									return Array.from({
										length: getDay(startOfMonth(new Date(year, meseCorrente))),
									}).map((_, index) => (
										<div key={index} className="date-cell empty-cell"></div>
									));
								})()}
								{/* Genera i bottoni per i giorni del mese */}
								{Array.from({
									length: getDaysInMonth(new Date(year, meseCorrente)),
								}).map((_, day) => (
									<div key={day + 1} className="date-cell" style={{ position: "relative", minHeight: "100px" }}>
										<div>
											{renderMonthEvents(monthEvents, day)}
										</div>
										<button onClick={(e): void => {
											handleDateClick(day + 1);
											dayMode(e as React.MouseEvent<HTMLElement>);
										}}>
											{day + 1}
										</button>

									</div>
								))}
							</div>
						</div>
					</div>
				)
			}
		</>
	);
}
