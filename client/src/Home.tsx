import React from "react";
import { SERVER_API } from "./lib/params";
import { ResponseBody } from "./types/ResponseBody";
import Pomodoro from "./types/Pomodoro";
import Note from "./types/Note";
import { Event } from "./types/Event";
import { useNavigate } from "react-router-dom";
import { ResponseStatus } from "./types/ResponseStatus";
import User from "./types/User";
import type Project from "./types/Project";
import { checkLoginStatus } from "./AuthContext";

const HOME_MAX_TITLE_CHARS = 20;
const HOME_MAX_TEXT_CHARS = 10;

function Home(): React.JSX.Element {
	//const [message, setMessage] = React.useState("");
	const [pomodoros, setPomodoros] = React.useState([] as Pomodoro[]);
	const [notes, setNotes] = React.useState([] as Note[]);
	const [events, setEvents] = React.useState([] as Event[]);
	const [projects, setProjects] = React.useState([] as Project[]);
	const [numEvents, setNumEvents] = React.useState(4);
	const [numPomodoros, setNumPomodoros] = React.useState(4);
	const [numNotes, setNumNotes] = React.useState(4);
	const [numProjects, setNumProjects] = React.useState(4);
	const [eventList, setEventList] = React.useState<Event[]>([]);
	const [currentDate, setCurrentDate] = React.useState(new Date());

	const nav = useNavigate();


	const fetchCurrentDate = async (): Promise<void> => {
		try {
			const response = await fetch(`${SERVER_API}/currentDate`);
			if (!response.ok) {
				throw new Error("Errore nel recupero della data corrente");
			}
			const data = await response.json();
			console.log("Questa è la data corrente in fetchCurrentDate:", data.currentDate);
			setCurrentDate(new Date(data.currentDate));
		} catch (error) {
			console.error("Errore durante il recupero della data corrente:", error);
		}
	};

	React.useEffect(() => {
		fetchCurrentDate();
	}, []);

	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/pomodoro`);
				if (res.status === 200) {
					const resBody = (await res.json()) as ResponseBody;
					setPomodoros(resBody.value as Pomodoro[]);
				} else {
					await checkLoginStatus();
					nav("/login");
				}
			} catch (e) {
				console.log("Impossibile raggiungere il server");
			}

			try {
				const res = await fetch(`${SERVER_API}/notes`);
				if (res.status === 200) {
					const resBody = (await res.json()) as ResponseBody;
					console.log(resBody);

					setNotes(resBody.value as Note[]);
				} else {
					await checkLoginStatus();
					nav("/login");
				}
			} catch (e) {
				console.log("Impossibile raggiungere il server");
			}

			try {
				const currentUser = await getCurrentUser();
				const owner = currentUser.value._id.toString();
				//console.log("Questo è l'owner:", owner);

				const dataCorrente = currentDate;

				const res = await fetch(`${SERVER_API}/events/owner?owner=${owner}`);
				const data = await res.json();
				var eventi = data.value;
				let eventiFiltrati = [];

				const normalizeDate = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

				for (const event of eventi) {
					const eventStartDate = new Date(event.startTime);
					const eventEndDate = new Date(event.endTime);
					const currentDate = new Date(dataCorrente);

					const normalizedEventStartDate = normalizeDate(eventStartDate);
					const normalizedEventEndDate = normalizeDate(eventEndDate);
					const normalizedCurrentDate = normalizeDate(currentDate);

					// Evento singolo che è oggi o futuro
					const isSameDayEvent = normalizedEventStartDate >= normalizedCurrentDate ||
						(normalizedEventStartDate <= normalizedCurrentDate && normalizedEventEndDate >= normalizedCurrentDate);

					// Eventi ricorrenti
					const isDailyInfiniteEvent =
						event.frequency === "day" &&
						event.isInfinite === true;

					const isMonthlyInfiniteEvent =
						event.frequency === "month" &&
						event.isInfinite === true &&
						eventStartDate.getDate() === currentDate.getDate();

					const isWeeklyInfiniteEvent =
						event.frequency === "week" &&
						event.isInfinite === true &&
						eventStartDate.getDay() === currentDate.getDay();

					const isYearlyInfiniteEvent =
						event.frequency === "year" &&
						event.isInfinite === true &&
						eventStartDate.getDate() === currentDate.getDate() &&
						eventStartDate.getMonth() === currentDate.getMonth();

					if (isSameDayEvent || isDailyInfiniteEvent || isMonthlyInfiniteEvent ||
						isWeeklyInfiniteEvent || isYearlyInfiniteEvent) {
						eventiFiltrati.push(event);
					}
				}
				// ... rest of the code ...
				console.log("Questi sono gli eventi filtrati:", eventiFiltrati);

				if (res.status === 200) {
					setEvents(eventiFiltrati);
					console.log("stampo events:", events);
				} else {
					await checkLoginStatus();
					nav("/login");
				}
			} catch (e) {
				console.log("Impossibile raggiungere il server");
			}

			// get projects
			try {
				const res = await fetch(`${SERVER_API}/projects`);
				if (res.status === 200) {
					const resBody = (await res.json()) as ResponseBody;
					console.log(resBody);

					setProjects(resBody.value as Project[]);
				} else {
					console.log("Error getting projects: " + (await res.json()).message);
					await checkLoginStatus();
					nav("/login");
				}
			} catch (e) {
				console.log("Impossibile raggiungere il server");
			}
		})();
	}, []);

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

	// Combina i due useEffect in uno solo
	React.useEffect(() => {
		// Funzione che esegue entrambe le operazioni in sequenza
		const updateDateAndEvents = async (): Promise<void> => {
			await fetchCurrentDate();  // Prima aggiorna la data
			loadEvents();             // Poi carica gli eventi
		};

		// Esegui subito
		updateDateAndEvents();

		// Imposta l'intervallo
		const interval = setInterval(updateDateAndEvents, 1000);

		// Cleanup
		return () => clearInterval(interval);
	}, []);

	async function loadEvents(): Promise<void> {
		try {
			const currentUser = await getCurrentUser();
			//console.log("Valore ottenuto:", currentUser);

			const owner = currentUser.value._id.toString();
			console.log("Questo è l'owner:", owner);
			const res = await fetch(`${SERVER_API}/events/owner?owner=${owner}`);
			const data = await res.json();
			var eventi = data.value;
			// Ottieni la data corrente direttamente dal server
			const response = await fetch(`${SERVER_API}/currentDate`);
			const dateData = await response.json();
			const dataCorrente = new Date(dateData.currentDate);
			console.log("Questa è la data corrente in loadEvents:", dataCorrente);
			console.log("EVENTI TROVATI:", eventi);
			let eventiFiltrati = [];

			const normalizeDate = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

			for (const event of eventi) {
				const eventStartDate = new Date(event.startTime);
				const eventEndDate = new Date(event.endTime);
				const currentDate = new Date(dataCorrente);

				const normalizedEventStartDate = normalizeDate(eventStartDate);
				const normalizedEventEndDate = normalizeDate(eventEndDate);
				const normalizedCurrentDate = normalizeDate(currentDate);

				// Evento singolo che è oggi o futuro
				const isSameDayEvent = normalizedEventStartDate >= normalizedCurrentDate ||
					(normalizedEventStartDate <= normalizedCurrentDate && normalizedEventEndDate >= normalizedCurrentDate);

				// Eventi ricorrenti
				const isDailyInfiniteEvent =
					event.frequency === "day" &&
					event.isInfinite === true;

				const isMonthlyInfiniteEvent =
					event.frequency === "month" &&
					event.isInfinite === true &&
					eventStartDate.getDate() === currentDate.getDate();

				const isWeeklyInfiniteEvent =
					event.frequency === "week" &&
					event.isInfinite === true &&
					eventStartDate.getDay() === currentDate.getDay();

				const isYearlyInfiniteEvent =
					event.frequency === "year" &&
					event.isInfinite === true &&
					eventStartDate.getDate() === currentDate.getDate() &&
					eventStartDate.getMonth() === currentDate.getMonth();

				if (isSameDayEvent || isDailyInfiniteEvent || isMonthlyInfiniteEvent ||
					isWeeklyInfiniteEvent || isYearlyInfiniteEvent) {
					eventiFiltrati.push(event);
				}
			}

			console.log("EVENTI FILTRATI:", eventiFiltrati);

			if (data.status === ResponseStatus.GOOD) {
				setEventList(eventiFiltrati);
				//console.log("Eventi trovati:", eventi);
			} else {
				// await checkLoginStatus();
				console.log("Errore nel ritrovamento degli eventi");
			}
		} catch (e) {
			console.log("Impossibile raggiungere il server");
		}
	}

	/*async function loadPomodoros(): Promise<void> {
		try {
			const currentUser = await getCurrentUser();
			console.log("Valore ottenuto:", currentUser);

			const owner = currentUser.value.username;
			console.log("Questo è l'owner:", owner);
			const res = await fetch(`${SERVER_API}/pomodoro/owner?owner=${owner}`);
			const data = await res.json();
			console.log("Pomodoros trovati:", data);

			if (data.status === ResponseStatus.GOOD) {
				setPomodoros(data.value);
				console.log("stampo data.values:", data.value);
			} else {
				setMessage("Errore nel ritrovamento dei pomodoro");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}*/

	React.useEffect(() => {
		loadEvents();
		//loadPomodoros();
	}, []);

	return (
		<>
			{/* {message && <div className="error-message">{message}</div>*/}

			<div className="home-background">
				<div className="home-container">
					<div className="preview preview-calendar">
						<h4>Prossimi eventi:</h4>
						<label>
							Mostra
							<select
								value={numEvents}
								className="home-select"
								onChange={(e): void => setNumEvents(Number(e.target.value))}>
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
							</select>
							eventi:
						</label>
						<div className="preview-calendar-cards-container">
							{eventList
								.filter((_, i) => i < numEvents)
								.map((event) => (
									<a className="preview-calendar-card" href={`/calendar`}>
										<div>
											<div className="preview-calendar-card-title">
												{event.title.length > HOME_MAX_TITLE_CHARS
													? event.title.substring(
														0,
														HOME_MAX_TITLE_CHARS
													) + "..."
													: event.title}
											</div>
											<div>
												{new Date(event.startTime).toLocaleString("it-IT", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</div>
											<div>
												{new Date(event.endTime).toLocaleString("it-IT", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</div>
											<div>{event.location}</div>
										</div>
									</a>
								))}
						</div>
					</div>

					<div className="preview preview-pomodoro">
						<h4>Pomodoro recenti:</h4>
						<label>
							Mostra
							<select
								value={numPomodoros}
								className="home-select"
								onChange={(e): void => setNumPomodoros(Number(e.target.value))}>
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
							</select>
							pomodoro:
						</label>
						<div className="preview-pomodoro-cards-container">
							{pomodoros
								.slice(-numPomodoros) // perchè non devo filtrare come nelle note
								.map((pomodoro) => (
									<a className="preview-pomodoro-card" href={`/pomodoro`}>
										<div>
											<div>{pomodoro.studyTime} min</div>
											<div>{pomodoro.pauseTime} min</div>
											<div>{pomodoro.cycles} cicli</div>
										</div>
									</a>
								))}
						</div>
					</div>

					<div className="preview preview-note">
						<h4>Le tue note recenti:</h4>
						<label>
							Mostra
							<select
								value={numNotes}
								className="home-select"
								onChange={(e): void => setNumNotes(Number(e.target.value))}>
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
							</select>
							note:
						</label>
						<div className="preview-note-cards-container">
							{notes
								.filter((_, i) => i < numNotes)
								.map((note) => (
									<a className="preview-note-card" href={`/notes/${note.id}`}>
										<div>
											<div className="preview-note-card-title">
												{note.title.length > HOME_MAX_TITLE_CHARS
													? note.title.substring(
														0,
														HOME_MAX_TITLE_CHARS
													) + "..."
													: note.title}
											</div>
											<div className="preview-note-card-text">
												{note.text.length > HOME_MAX_TEXT_CHARS
													? note.text.substring(0, HOME_MAX_TEXT_CHARS) +
													"..."
													: note.text}
											</div>
										</div>
									</a>
								))}
						</div>
					</div>

					<div className="preview preview-projects">
						<h4>I tuoi progetti:</h4>
						<label>
							Mostra
							<select
								value={numProjects}
								className="home-select"
								onChange={(e): void => setNumProjects(Number(e.target.value))}>
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
							</select>
							progetti:
						</label>
						<div className="preview-projects-cards-container">
							{projects
								.filter((_, i) => i < numProjects)
								.map((project) => (
									<a
										className="preview-projects-card"
										href={`/projects/${project.id}`}>
										<div>
											<div className="preview-projects-card-title">
												{project.title.length > HOME_MAX_TITLE_CHARS
													? project.title.substring(
														0,
														HOME_MAX_TITLE_CHARS
													) + "..."
													: project.title}
											</div>
											<div className="preview-projects-card-text">
												{project.description.length > HOME_MAX_TEXT_CHARS
													? project.description.substring(
														0,
														HOME_MAX_TEXT_CHARS
													) + "..."
													: project.description}
											</div>
										</div>
									</a>
								))}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default Home;
