import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import Pomodoro from "./types/Pomodoro";
import Note from "./types/Note";
import { Event } from "./types/Event";

function Home(): React.JSX.Element {
	const [message, setMessage] = React.useState("");
	const [pomodoros, setPomodoros] = React.useState([] as Pomodoro[]);
	const [notes, setNotes] = React.useState([] as Note[]);
	const [events, setEvents] = React.useState([] as Event[]);

	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/pomodoro`);
				if (res.status === 200) {
					const resBody = (await res.json()) as ResponseBody;
					setPomodoros(resBody.value as Pomodoro[]);
				} else {
					setMessage("Errore nel ritrovamento delle sessioni pomodoro salvate");
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
					setMessage("Errore nel ritrovamento delle note salvate");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}

			try {
				const res = await fetch(`${SERVER_API}/events`);
				if (res.status === 200) {
					const resBody = (await res.json()) as ResponseBody;
					setEvents(resBody.value as Event[]);
				} else {
					setMessage("Errore nel ritrovamento dei prossimi eventi");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	return (
		<>
			{message && <div>{message}</div>}
			<div className="home-container">
				<div className="preview preview-calendar">
					<div>Prossimi eventi:</div>
					{events.map((event) => (
						<div>
							<div>{event.title}</div>
							<div>{event.startTime.toString()}</div>
							<div>{event.endTime.toString()}</div>
							<div>{event.location}</div>
						</div>
					))}
				</div>
				<div className="preview preview-pomodoro">
					<div>Lista di pomodoro precedenti:</div>
					{pomodoros.map((pomodoro) => (
						<div>
							<div>{pomodoro.studyTime}</div>
							<div>{pomodoro.pauseTime}</div>
							<div>{pomodoro.cycles}</div>
							<div>{pomodoro.updatedAt?.toString()}</div>
						</div>
					))}
				</div>
				<div className="preview preview-note">
					<div>Le tue note recenti:</div>
					{notes
						.filter((_, i) => i <= 6)
						.map((note) => (
							<a className="preview-note-card" href={`/notes/${note.id}`}>
								<div>
									<div className="preview-note-card-title">{note.title}</div>
									<div className="preview-note-card-text">
										{note.text.length > 100
											? note.text.substring(0, 100) + "..."
											: note.text}
									</div>
								</div>
								<div className="preview-note-card-date">
									Last update: {note.updatedAt?.toString()}
								</div>
							</a>
						))}
				</div>
				<div className="preview preview-projects">Qui ci va la preview dei progetti</div>
			</div>
		</>
	);
}

export default Home;
