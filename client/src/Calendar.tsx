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

enum Frequency {
	ONCE = "once",
	DAILY = "day",
	WEEKLY = "week",
}

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

export default function Calendar(): React.JSX.Element {
	const [title, setTitle] = React.useState("");
	const [createEvent, setCreateEvent] = React.useState(false);
	const [startTime, setStartTime] = React.useState(new Date());
	const [endTime, setEndTime] = React.useState(() => {
		const now = new Date();
		now.setMinutes(now.getMinutes() + 30);
		return now;
	});
	const [location, setLocation] = React.useState("");
	const [meseCorrente, setMeseCorrente] = React.useState(new Date().getMonth()); //inizializzazione mese corrente
	const [message, setMessage] = React.useState("");
	const [day, setDay] = React.useState(new Date().getDate());
	const [activeButton, setActiveButton] = React.useState(0);
	const [year, setYear] = React.useState(2024);
	const [eventList, setEventList] = React.useState<Event[]>([]);
	const [addTitle, setAddTitle] = React.useState(true);
	/*
	const [eventName, setEventName] = React.useState("");
	const [eventHeight, setEventHeight] = React.useState(0);
	const [eventTop, setEventTop] = React.useState(0);
	*/
	const [eventPositions, setEventPositions] = React.useState<{ top: number; height: number; name: string; type: boolean, width: number, marginLeft: number, event: Event }[]>([]);
	const nav = useNavigate();

	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/events`);
				if (res.status !== 200) {
					nav("/login");
				}

				const data = (await res.json()) as ResponseBody;

				//console.log(data);

				if (data.status === ResponseStatus.GOOD) {
					setEventList(data.value);
				} else {
					setMessage("Errore nel ritrovamento degli eventi");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	function dayMode(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setActiveButton(0);
		console.log(activeButton);
	}

	function weekMode(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setActiveButton(1);
		console.log(activeButton);
	}

	function monthMode(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setActiveButton(2);
		console.log(activeButton);
	}

	function nextWeek(e: React.MouseEvent<HTMLButtonElement>): void {
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
	}

	function prevWeek(e: React.MouseEvent<HTMLButtonElement>): void {
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
	}

	function mesePrecedente(): void {
		setEventPositions([]);
		if (meseCorrente === 0) {
			setMeseCorrente((meseCorrente - 1 + 12) % 12);
			setYear(year - 1);
		} else {
			setMeseCorrente((meseCorrente - 1 + 12) % 12);
		}
		//handleDateClick(day);
	}

	function meseSuccessivo(): void {
		setEventPositions([]);
		if (meseCorrente === 11) {
			setMeseCorrente((meseCorrente + 1) % 12);
			setYear(year + 1);
		} else {
			setMeseCorrente((meseCorrente + 1) % 12);
		}
		//handleDateClick(5);
	}

	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const currentUser = await getCurrentUser();
				console.log("Valore ottenuto:", currentUser);

				const owner = currentUser.value.username;;
				console.log("Questo è l'ownerr:", owner);
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
		console.log("EventList aggiornato", eventList);
	}, [eventList]); // Esegui questo effetto ogni volta che eventList cambia

	//funzione per aggiungere pallino al giorno che contiene eventi
	function hasEventsForDay(day: number): boolean {
		return eventList.some(event => {
			const eventDate = new Date(event.startTime).getDate();
			const eventMonth = new Date(event.startTime).getMonth();
			const eventYear = new Date(event.startTime).getFullYear();
			return eventDate === day && eventMonth === meseCorrente && eventYear === year;
		});
	}



	// Toggle create event screen
	//da implementare

	function toggleCreateEvent(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setCreateEvent(!createEvent);
	}



	async function handleDateClick(e: React.MouseEvent<HTMLButtonElement> | number): Promise<void> {
		//e.preventDefault();
		setEventPositions([]);
		console.log("CIAOOOOOOOOOOOOOOOOOOOOOOOOOOOO", e);
		let dayValue: number;
		console.log(day, Mesi[meseCorrente], year);
		console.log(day, meseCorrente, year);
		if (typeof e === "number") {
			dayValue = e;
		}
		else {
			dayValue = Number(e.currentTarget.textContent);
		}
		console.log("Clicked day:", dayValue); // Log per il debug
		setDay(dayValue);

		try {

			const date = new Date();
			date.setDate(dayValue);
			date.setMonth(meseCorrente);
			date.setFullYear(year);
			console.log(date);

			const res = await fetch(`${SERVER_API}/events/eventsOfDay`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					date: date.toISOString(),
				}),
			});
			const data = await res.json();
			console.log("Questi sono gli eventi del giorno:", data)

			const eventi = data.value; //ottieni la lista di eventi
			if (eventi && eventi.length > 0) {
				const positions = eventi.map((evento: Event) => {
					if (evento && evento.startTime) {
						const oraInizioEvento = new Date(evento.startTime).getHours() - 2;
						const minutiInizioEvento = new Date(evento.startTime).getMinutes();
						const minutiFineEvento = new Date(evento.endTime).getMinutes();
						const oraFineEvento = new Date(evento.endTime).getHours() - 2;

						// Calcola la posizione e l'altezza per ogni evento
						const topPosition = (54 * oraInizioEvento) + (54 * (minutiInizioEvento / 60)); // Posizione verticale
						const eventHeight = 54 * (oraFineEvento - oraInizioEvento) + 54 * (minutiFineEvento / 60) - 54 * (minutiInizioEvento / 60); // Altezza dell'evento

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


				console.log("POSIZIONI FINALI EVENTI:", finalPositions);

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

	async function handleDeleteEvent(id: string): Promise<void> {
		console.log("day:", day);
		try {
			console.log("Evento da eliminare:", id);
			const res = await fetch(`${SERVER_API}/events/deleteEvent`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					event_id: id,
				}),
			});
			const data = await res.json();

			console.log("EVENTO ELIMINATO:", data);
			handleDateClick(day);
			return data;

		}
		catch (e) {
			setMessage("Errore nell'eliminazione dell'evento");
			return;
		}

	}



	async function getCurrentUser(): Promise<Promise<any> | null> {
		try {
			const res = await fetch(`${SERVER_API}/users`);
			if (!res.ok) { // Controlla se la risposta non è ok
				setMessage("Utente non autenticato");
				return null; // Restituisci null se non autenticato
			}
			console.log("Questa è la risposta alla GET per ottenere lo user", res);
			const data: User = await res.json();
			console.log("Questo è il json della risposta", data);
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
		console.log("Valore ottenuto:", currentUser);

		const owner = currentUser.value.username;

		const res = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				owner,
				title,
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString(),
				frequency: Frequency.ONCE,
				location,
			}),
		});

		if (!res.ok) {
			const errorData = await res.json();
			console.error("Error response:", errorData);
			setMessage("Errore durante la creazione dell'evento: " + errorData.message);
			return;
		}

		const data: ResponseBody = (await res.json()) as ResponseBody;

		setMessage(data.message || "Undefined error");
		setCreateEvent(!createEvent);

		window.location.reload()

		// TODO: send post request to server
		// TODO: handle response
	}

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


	return (
		<>
			{message && <div>{message}</div>}
			{day && (
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
									color: "white",
									border: "0",
									minWidth: "100px",
									fontSize: "1rem",
								}}
								onClick={toggleCreateEvent}>
								Add Event
							</button>
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
								}}>
								{"<<"}
							</button>
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
						</div>
						<div className="day-of-week">
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
					</div>
					{createEvent && (
						<div className="create-event-container col-2">
							<button
								className="btn btn-primary"
								style={{ backgroundColor: "bisque", color: "white", border: "0" }}
								onClick={toggleCreateEvent}>
								Close
							</button>
							<form>
								<label htmlFor="useDefaultTitle">
									Pomodoro Session?
									<input
										type="checkbox"
										name="useDefaultTitle"
										onClick={toggleEventTitle}
										style={{ marginLeft: "5px" }}
									/>
								</label>
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

									<div>
										<input
											className="btn border"
											type="time"
											value={`${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`}
											onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
												const [hours, minutes] = e.target.value.split(':');
												const newDate = new Date(startTime); // Crea un nuovo oggetto Date basato su startTime
												newDate.setHours(Number(hours), Number(minutes), 0, 0); // Imposta l'orario
												setStartTime(newDate); // Imposta il nuovo oggetto Date
											}}
										/>
									</div>
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
										/>
									</div>
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
								<button
									className="btn btn-primary"
									style={{
										backgroundColor: "bisque",
										color: "white",
										border: "0",
									}}
									onClick={handleCreateEvent}>
									Create Event
								</button>
							</form>
						</div>
					)}
					<div className="orario col-5">


						<div>
							{eventPositions.map((event, index) => (
								// Se event.type è true, rendi il div cliccabile, altrimenti mostra solo il div
								!event.type ? (
									<Link
										to={`/pomodoro?duration=${
											// Funzione per calcolare la durata dell'evento e scriverlo come query param
											((startTime, endTime): number => {
												const start = new Date(startTime); // Crea un oggetto Date per l'inizio
												const end = new Date(endTime); // Crea un oggetto Date per la fine
												const totMin = Math.max((end.getTime() - start.getTime()) / (1000 * 60), 0);
												return totMin;
											})(event.event.startTime, event.event.endTime) // Passa startTime e endTime
											}`}
										key={index} // Assicurati di fornire una chiave unica per ogni elemento
										style={{ textDecoration: 'none' }} // Rimuove l'eventuale sottolineatura del link
									>
										<div
											key={index} // Assicurati di fornire una chiave unica per ogni elemento
											className="evento"
											style={{
												top: `${event.top}px`, // Imposta la posizione verticale
												height: `${event.height}px`, // Imposta l'altezza dell'evento
												width: `calc(95%/${event.width})`,
												position: "absolute", // Assicurati che sia posizionato correttamente
												color: "red", // Colore rosso se event.type è false
												borderColor: "red",
												backgroundColor: "rgba(249, 67, 67, 0.5)",
												marginLeft: `${event.marginLeft}%`,
												cursor: "pointer",
											}}
										>
											{event.name}
											<div className="position-relative" onClick={(): Promise<void> => handleDeleteEvent(event.event._id)}>
												{/* Questo div ha una posizione relativa per consentire il posizionamento assoluto dell'icona */}
												<i className="bi bi-trash position-absolute"
													style={{
														bottom: "2px", // Posiziona l'icona a 10px dal fondo
														right: "50%",  // Posiziona l'icona a 10px dal lato destro
														fontSize: "1.5rem",

														color: "red",
														cursor: "pointer"
													}}
												></i>
											</div>

										</div>
									</Link>
								) : (
									<div
										className="evento"
										style={{
											top: `${event.top}px`, // Imposta la posizione verticale
											height: `${event.height}px`, // Imposta l'altezza dell'evento
											width: `calc(95%/${event.width})`,
											position: "absolute", // Assicurati che sia posizionato correttamente
											color: "rgb(155, 223, 212)", // Imposta il colore per eventi normali
											borderColor: "rgb(155, 223, 212)",
											backgroundColor: "rgba(155, 223, 212, 0.5)", // Colore di sfondo
											marginLeft: `${event.marginLeft}%`,
											cursor: "default",
										}}
									>
										{event.name}
										<div className="position-relative" onClick={(): Promise<void> => handleDeleteEvent(event.event._id)}>
											{/* Questo div ha una posizione relativa per consentire il posizionamento assoluto dell'icona */}
											<i className="bi bi-trash position-absolute"
												style={{
													bottom: "2px", // Posiziona l'icona a 10px dal fondo
													right: "50%",  // Posiziona l'icona a 10px dal lato destro
													fontSize: "1.5rem",
													margin: 0,
													padding: 0,
													color: "rgb(155, 223, 212)",
													cursor: "pointer"
												}}
											></i>
										</div>

									</div>

								)
							))}
						</div>


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
						<time>00:00</time>
					</div>
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
									const dayOfWeek = getDay(new Date(year, meseCorrente, day));
									console.log(dayOfWeek);
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
												fontWeight: 500,
												fontSize: "0.6em",
												letterSpacing: "0.1em",
												fontVariant: "small-caps",
											}}>
											Dom{" "}
											{getDay(new Date(year, meseCorrente, day)) === 5 &&
												getAdjustedDay(day, -5, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 4 &&
												getAdjustedDay(day, -4, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 3 &&
												getAdjustedDay(day, -3, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 2 &&
												getAdjustedDay(day, -2, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 1 &&
												getAdjustedDay(day, -1, year, meseCorrente)}
											{getDay(new Date(year, meseCorrente, day)) === 0 &&
												getAdjustedDay(day, 0, year, meseCorrente)}
										</div>
										<div
											className="orario"
											style={{
												fontSize: "0.8vw",
												width: "calc(100% - 10px)",
												flex: "1",
											}}>
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
											<time>00:00</time>
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
											}}>
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
											<time>00:00</time>
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
											}}>
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
											<time>00:00</time>
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
											}}>
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
											<time>00:00</time>
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
											}}>
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
											<time>00:00</time>
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
											}}>
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
											<time>00:00</time>
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
											}}>
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
											<time>00:00</time>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
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
									<div key={day + 1} className="date-cell">
										<button onClick={handleDateClick}>{day + 1}</button>
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
