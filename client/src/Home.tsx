import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import Pomodoro from "./types/Pomodoro";
import Note from "./types/Note";
import { Event } from "./types/Event";
// import { useNavigate } from "react-router-dom";
import { ResponseStatus } from "./types/ResponseStatus";
import User from "./types/User";
import type Project from "./types/Project";
import { checkLoginStatus } from "./AuthContext";

const HOME_MAX_TITLE_CHARS = 20;
const HOME_MAX_TEXT_CHARS = 10;

function Home(): React.JSX.Element {
	const [message, setMessage] = React.useState("");
	const [pomodoros, setPomodoros] = React.useState([] as Pomodoro[]);
	const [notes, setNotes] = React.useState([] as Note[]);
	const [events, setEvents] = React.useState([] as Event[]);
	const [projects, setProjects] = React.useState([] as Project[]);
	const [numEvents, setNumEvents] = React.useState(4);
	const [numPomodoros, setNumPomodoros] = React.useState(4);
	const [numNotes, setNumNotes] = React.useState(4);
	const [numProjects, setNumProjects] = React.useState(4);
	const [eventList, setEventList] = React.useState<Event[]>([]);

	// const nav = useNavigate();

	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/pomodoro`);
				if (res.status === 200) {
					const resBody = (await res.json()) as ResponseBody;
					setPomodoros(resBody.value as Pomodoro[]);
				} else {
					// await checkLoginStatus();
					// nav("/login");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}

			try {
				const res = await fetch(`${SERVER_API}/notes`);
				if (res.status === 200) {
					const resBody = (await res.json()) as ResponseBody;
					console.log(resBody);

					setNotes(resBody.value as Note[]);
				} else {
					// await checkLoginStatus();
					// nav("/login");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}

			try {
				const currentUser = await getCurrentUser();
				const owner = currentUser.value._id.toString();
				console.log("Questo è l'owner:", owner);

				const res = await fetch(`${SERVER_API}/events/owner?owner=${owner}`);
				const data = await res.json();
				var eventi = data.value;
				if (res.status === 200) {
					setEvents(eventi);
					console.log("stampo events:", events);
				} else {
					// await checkLoginStatus();
					// nav("/login");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
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
					// nav("/login");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	async function getCurrentUser(): Promise<Promise<any> | null> {
		try {
			const res = await fetch(`${SERVER_API}/users`);
			if (!res.ok) {
				// Controlla se la risposta non è ok
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

	async function loadEvents(): Promise<void> {
		try {
			const currentUser = await getCurrentUser();
			//console.log("Valore ottenuto:", currentUser);

			const owner = currentUser.value._id.toString();
			console.log("Questo è l'owner:", owner);
			const res = await fetch(`${SERVER_API}/events/owner?owner=${owner}`);
			const data = await res.json();
			var eventi = data.value;
			//console.log("Eventi trovati:", data);

			if (data.status === ResponseStatus.GOOD) {
				setEventList(eventi);
				console.log("Eventi trovati:", eventi);
			} else {
				// await checkLoginStatus();
				setMessage("Errore nel ritrovamento degli eventi");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
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
			{message && <div>{message}</div>}

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
