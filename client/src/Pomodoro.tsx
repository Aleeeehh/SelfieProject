import React from "react";
import { useState, ChangeEvent, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { SERVER_API } from "./params/params";
import { useNavigate, useLocation } from "react-router-dom";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Pomodoro from "./types/Pomodoro";
import User from "./types/User";


import DatePicker from "react-datepicker";	//to create pomodoro events
//import Time from "react-datepicker/dist/time";


enum MESSAGE {
	PRESS_START = "FILL THE SPACES AND PRESS START TO BEGIN!",
	ERROR = "INSERT AN INTEGER NUMBER FOR STUDY TIME, PAUSE TIME AND STUDY CYCLES! (1-99)",
	VOID = "",
	MINUTES = "INSERT THE AMOUNT OF MINUTES OF STUDY (1-3465)",
	HOURS = "INSERT THE AMOUNT OF HOURS OF STUDY (1-57)"
}

enum STATUS {
	BEGIN = "BEGIN SESSION",
	STUDY = "STUDY",
	PAUSE = "PAUSE",
	END = "END OF SESSION",
}

enum Frequency {
	ONCE = "once",
	DAILY = "day",
	WEEKLY = "week",
}

type PomodoroData = {
	studyTime: number;
	pauseTime: number;
	cycles: number;
	status: STATUS;
	message: MESSAGE;
	minutes: number;
	seconds: number;
	studying: boolean;
	activeTimer: boolean;
	intervalId?: NodeJS.Timeout;
	totMinutes: number;
	totHours: number;
};

type PomodoroEvent = {
	addTitle: boolean;
	title: string;
	startTime: Date;
	endTime: Date;
	location: string;
};

const initialPomEvent: PomodoroEvent = {
	addTitle: true,
	title: "Pomodoro Session",
	startTime: new Date(),
	endTime: new Date(),
	location: "",
};

const initialState: PomodoroData = {
	studyTime: 30,
	pauseTime: 5,
	cycles: 5,
	status: STATUS.BEGIN,
	message: MESSAGE.PRESS_START,
	minutes: 0,
	seconds: 0,
	studying: true,
	activeTimer: false,
	intervalId: undefined,
	totMinutes: 0,
	totHours: 0,
};

export default function Pomodoros(): React.JSX.Element {
	const [data, setData] = useState(initialState);
	const [pomEvent, setPomEvent] = useState(initialPomEvent);
	const [message, setMessage] = useState("");
	const [tomatoList, setTomatoList] = React.useState([] as Pomodoro[]);

	const pomodoroRef = useRef<HTMLDivElement | null>(null);

	const nav = useNavigate();

	//setup per ricevere la durata dell'evento pomodoro cliccando dall'evento sul calendario
	const location = useLocation();

	const getQueryParams = (): number => {
		const params = new URLSearchParams(location.search); // Ottieni i parametri della query
		const duration = params.get('duration'); // Leggi il parametro "duration"
		return duration ? parseInt(duration) : 0; // Restituisci la durata come numero, oppure 0 se non è definita
	  };
	
	const duration = getQueryParams(); // Ottieni la durata dal query param
	

	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/pomodoro`);
				if (res.status !== 200) {
					nav("/login");
				}
				// TODO: set session value as response
				const data = (await res.json()) as ResponseBody;

				console.log(data);

				if (data.status === ResponseStatus.GOOD) {
					setTomatoList(data.value as Pomodoro[]);
				} else {
					setMessage("Errore nel ritrovamento dei pomodoro");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}

			//gestione della durata derivata dall'evento
			console.log("La durata dell'evento pomodoro è: " + duration);
			if (duration !== 0){
			setData((prevData) => {
				let {
					cycles,
					studyTime,
					totMinutes,
					pauseTime,
				} = prevData;
				
				totMinutes = duration;

				studyTime = 30;
				pauseTime = 5;

				if (totMinutes%35 !== 0) {
					cycles = Math.floor(totMinutes / 35) + 1; // +1 perchè ho i tasti per passare avanti
				}											  // quindi se il tempo totale è troppo non è un problema
				else {
					cycles = Math.floor(totMinutes / 35);
				}

				return {
					...prevData,
					cycles,
					pauseTime,
					studyTime,
					totMinutes,
				} as PomodoroData;
			});
		}})();
	}, []);

	function inputCheck(): boolean {
		if (
			data.studyTime <= 0 ||
			data.studyTime > 99 ||
			data.pauseTime <= 0 ||
			data.pauseTime > 99 ||
			data.cycles <= 0 ||
			data.cycles > 99
		) {
			return false;
		} else {
			return true;
		}
	}
	function playRing(): void {
		const ring = document.getElementById("ring") as HTMLAudioElement;
		if (ring) {
			ring.play();
		}
	}

	function startProcess(): void {
		if (inputCheck()) {
			playRing();
			clearInterval(data.intervalId);

			const interval = setInterval(() => {
				updateTimer();
			}, 1000);		//mettere 1000

			setData({
				...data,
				message: MESSAGE.VOID,
				studying: true,
				activeTimer: true,
				intervalId: interval,
				status: STATUS.STUDY,
				minutes: data.studyTime,
				seconds: 0,
			});
			startAnimation(true);
			
		} else {
			setData({ ...data, message: MESSAGE.ERROR });
		}
	}

	async function handleSavePomodoroConfig(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		try {
			const pomodoroConfig = {
				studyTime: data.studyTime,
				pauseTime: data.pauseTime,
				cycles: data.cycles,
				owner: "" ,
			};
			console.log("Dati inviati al server:", pomodoroConfig);

			const res = await fetch(`${SERVER_API}/pomodoro`, {
				method: "POST",
				body: JSON.stringify(pomodoroConfig),
				headers: { "Content-Type": "application/json" },
			});
	
			const resBody = await res.json();
	
			if (resBody.status === ResponseStatus.GOOD) {
				alert("Configurazione Pomodoro salvata correttamente!");
				startProcess();
				//await updateTomatoList();
			} else {
				setMessage("Errore nel salvataggio della configurazione");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}
	
	//Funzione per aggiornare la lista dei pomodori in tempo reale (non funziona al momento)

	/*const updateTomatoList = async (): Promise<void> => {
		try {
			const response = await fetch(`${SERVER_API}/pomodoro`);
			if (!response.ok) {
				throw new Error('Failed to fetch pomodori');
			}
			const fetchedTomatoes = await response.json();
			setTomatoList(fetchedTomatoes);
		} catch (error) {
			console.error(error);
		}
	};*/
	

	function stopProcess(): void {
		playRing();
		stopTimer();
	}

	function stopTimer(): void {
		clearInterval(data.intervalId);

		setData((prevData) => {
			return {
				...prevData,
				intervalId: undefined,
				activeTimer: false,
				status: STATUS.END,
			};
		});

		resetPomodoroColor();
	}

	function updateTimer(): void {
		setData((prevData) => {
			let {
				minutes,
				seconds,
				cycles,
				studyTime,
				studying,
				pauseTime,
				status,
				intervalId,
				activeTimer,
			} = prevData;

			seconds -= 1;
			if (seconds < 0) {
				seconds = 59;
				minutes -= 1;
			}

			if (minutes < 0) {
				if (cycles === 0) {
					clearInterval(prevData.intervalId);

					intervalId = undefined;
					activeTimer = false;
					status = STATUS.END;

					resetPomodoroColor();
					minutes = studyTime;
					seconds = 0;
				} else {
					if (studying) {
						// End of study session, enter pause
						console.log("Start pause session");
						status = STATUS.PAUSE;
						studying = false;
						playRing();
						startAnimation(false); // Passa false per l'animazione di pausa
						minutes = pauseTime;
						seconds = 0;
						cycles -= 1;
					} else {
						// End of pause session, start next study session
						console.log("Start study session");
						status = STATUS.STUDY;
						studying = true;
						playRing();
						startAnimation(true); // Passa true per l'animazione di studio
						minutes = studyTime;
						seconds = 0;
					}
				}
			}

			return {
				...prevData,
				minutes,
				seconds,
				cycles,
				studyTime,
				studying,
				pauseTime,
				status,
				intervalId,
				activeTimer,
			} as PomodoroData;
		});
	}

	function startAnimation(isStudying: boolean): void {
		console.log(isStudying);
		if (pomodoroRef.current) {
			pomodoroRef.current.classList.remove("animate-pomodoro");
			pomodoroRef.current.classList.remove("reverse-animate-pomodoro");
			if (isStudying) {
				pomodoroRef.current.style.animationDuration = `${data.studyTime * 60}s`;
				pomodoroRef.current.classList.add("animate-pomodoro");
			} else {
				pomodoroRef.current.style.animationDuration = `${data.pauseTime * 60}s`;
				pomodoroRef.current.classList.add("reverse-animate-pomodoro");
			}
		}
	}

	function pad(value: number): string {
		return value < 10 ? "0" + value : String(value);
	}

	function resetPomodoroColor(): void {
		if (pomodoroRef.current) {
			pomodoroRef.current.style.animationDuration = `0.1s`;
			pomodoroRef.current.classList.add("animate-pomodoro");

			setTimeout(() => {
				if (pomodoroRef.current) {
					pomodoroRef.current.classList.remove("animate-pomodoro");
				}
			}, 100);
		}
	}

	function nextPhase(): void {
		setData((prevData) => {
			let {
				minutes,
				seconds,
				cycles,
				studyTime,
				studying,
				pauseTime,
				status,
				intervalId,
				activeTimer,
			} = prevData;

			if (cycles === 0) {
				clearInterval(prevData.intervalId);

				intervalId = undefined;
				activeTimer = false;
				status = STATUS.END;

				resetPomodoroColor();
				minutes = studyTime;
				seconds = 0;
			} else {
				if (studying) {
					// End of study session, enter pause
					console.log("Start pause session");
					status = STATUS.PAUSE;
					studying = false;
					playRing();
					startAnimation(false); // Passa false per l'animazione di pausa
					minutes = pauseTime;
					seconds = 0;
					cycles -= 1;
				} else {
					// End of pause session, start next study session
					console.log("Start study session");
					status = STATUS.STUDY;
					studying = true;
					playRing();
					startAnimation(true); // Passa true per l'animazione di studio
					minutes = studyTime;
					seconds = 0;
				}
			}

			return {
				...prevData,
				minutes,
				seconds,
				cycles,
				studyTime,
				studying,
				pauseTime,
				status,
				intervalId,
				activeTimer,
			} as PomodoroData;
		});
	}

	function nextCycle(): void {
		if (data.studying) {
			nextPhase();
			nextPhase();
		}
		else {
			nextPhase();
		}
	}
	
	function repeatCycle(): void {
		setData((prevData) => {
			let {
				minutes,
				seconds,
				cycles,
				studyTime,
				studying,
				status,
			} = prevData;
			
			if (!studying) {
				cycles += 1;
			}
				status = STATUS.STUDY;
				studying = true;
				playRing();
				startAnimation(true); // Passa true per l'animazione di studio
				minutes = studyTime;
				seconds = 0;

			

			return {
				...prevData,
				minutes,
				seconds,
				cycles,
				studyTime,
				studying,
				status,
			} as PomodoroData;
		});
	}

	function proposalsMinutes(): void {
		setData((prevData) => {
			let {
				cycles,
				studyTime,
				totMinutes,
				pauseTime,
				message,
			} = prevData;

			if (totMinutes <= 0 || totMinutes > 3465) {
				setData({ ...data, message: MESSAGE.MINUTES });
			}
			else {
				studyTime = 30;
				pauseTime = 5;
				if (totMinutes%35 !== 0) {
					cycles = Math.floor(totMinutes / 35) + 1; // +1 perchè ho i tasti per passare avanti
				}											  // quindi se il tempo totale è troppo non è un problema
				else {
					cycles = Math.floor(totMinutes / 35);
				}
			}
			return {
				...prevData,
				cycles,
				pauseTime,
				studyTime,
				message,
				totMinutes,
			} as PomodoroData;
		});
	}

	function proposalsHours(): void {
		setData((prevData) => {
			let {
				cycles,
				message,
				studyTime,
				pauseTime,
				totHours,
				totMinutes,
			} = prevData;
			
			totMinutes = totHours * 60;
			if (totMinutes <= 0 || totMinutes > 3465) {
				setData({ ...data, message: MESSAGE.HOURS });
			}
			else {
				studyTime = 30;
				pauseTime = 5;
				if (totMinutes%35 !== 0) {
					cycles = Math.floor(totMinutes / 35) + 1;
				}
				else {
					cycles = Math.floor(totMinutes / 35);
				}
			}	
			return {
				...prevData,
				cycles,
				message,
				studyTime,
				pauseTime,
				totMinutes,
				totHours,
			} as PomodoroData;
		});
	}

	async function handleCreateEvent(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		//Validazione dell'input
		if (!pomEvent.title || !pomEvent.startTime || !pomEvent.endTime || !pomEvent.location) {
			setMessage("Tutti i campi dell'evento devono essere riempiti!");
			return;
		}

		if (pomEvent.startTime > pomEvent.endTime) {
			setMessage("La data di inizio non può essere collocata dopo la data di fine!");
			return;
		}

		const currentUser = await getCurrentUser();
		const res = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				owner: currentUser.value.username,
				title: pomEvent.title,
				startTime: pomEvent.startTime.toISOString(),
				endTime: pomEvent.endTime.toISOString(),
				frequency: Frequency.ONCE,
				location: pomEvent.location,
			}),
		});

		console.log(pomEvent.title, pomEvent.startTime, pomEvent.endTime, pomEvent.location)

		if (!res.ok) {
			const errorData = await res.json();
			console.error("Error response:", errorData);
			setMessage("Errore durante la creazione dell'evento: " + errorData.message);
			return;
		}

		const data: ResponseBody = (await res.json()) as ResponseBody;

		setMessage(data.message || "Undefined error");

		window.location.reload()

		// TODO: send post request to server
		// TODO: handle response
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


	return (
		<>
			{message && <div>{message}</div>}

			<audio id="ring" src="/images/ring.mp3"></audio>

			<div className="pomodoro-container">
				
				<header>
					<h1 id="title" style={{ color: "black", fontWeight: "bold" }}>POMODORO TIMER</h1>
				</header>

				<div className="preview">
					<div style={{ fontWeight: "bold" }}>POMODORO RECENTI:</div>
					{tomatoList.slice(-3).map((pomodoro, index) => (
						<button
							className="previous-pomodoros"
							key={index}
							onClick={(): void =>
								setData({
									...data,
									studyTime: pomodoro.studyTime,
									pauseTime: pomodoro.pauseTime,
									cycles: pomodoro.cycles,
								})
							}
						>
							{pomodoro.studyTime} min - {pomodoro.pauseTime} min - {pomodoro.cycles} cicli
							<br />
						</button>
					))}
				</div>

				<div ref={pomodoroRef} className="pomodoro">
					<img src="/images/tomato.png" alt="tomato.png" />
					<div id="timer" className="timer">
						{data.activeTimer ? `${pad(data.minutes)}:${pad(data.seconds)}` : ""}
					</div>
				</div>

				<div>
					<h4
						style={{
							margin: "0.5em auto 1em",
							width: "300px",
							color: "white",
							textAlign: "center",
						}}>
						{data.status}
					</h4>

					<div style={{display: "flex", justifyContent: "center"}}>
						<button
							id="start-button"		//probabilmente non serve l'id
							type="button"
							className="btn btn-success border"
							onClick={handleSavePomodoroConfig}
							disabled={data.activeTimer}>
							START
						</button>
						
						<button
							id="stop-button"		//probabilmente non serve l'id
							type="button"
							className="btn btn-danger border"
							onClick={stopProcess}
							disabled={!data.activeTimer}>
							STOP
						</button>
					</div>
					
						<br/>

					<div>
						<button
							id="next-button"		//probabilmente non serve l'id
							type="button"
							className="btn btn-warning border"
							onClick={nextPhase}
							disabled={!data.activeTimer}>
							NEXT PHASE
						</button>

						<button
							id="next-button"		//probabilmente non serve l'id
							type="button"
							className="btn btn-warning border"
							onClick={nextCycle}
							disabled={!data.activeTimer}>
							NEXT CYCLE
						</button>

						<button
							id="next-button"		//probabilmente non serve l'id
							type="button"
							className="btn btn-warning border"
							onClick={repeatCycle}
							disabled={!data.activeTimer}>
							REPEAT CYCLE
						</button>
					</div>

					<p className="paragraph">{data.message}</p>
				</div>

				<div className="pannello studyTime border">
					<label htmlFor="inputStudy">Study time in minutes</label>
					<input
						name="inputStudy"
						type="number"
						placeholder="Enter the time"
						className="inputStudyTime"
						id="inputStudy"
						value={data.studyTime}
						onChange={(e: ChangeEvent<HTMLInputElement>): void =>
							setData({ ...data, studyTime: parseInt(e.target.value) })
						}
						disabled={data.activeTimer}
					/>
				</div>

				<div className="pannello breakTime border">
					<label htmlFor="inputPause"> Break time in minutes </label>
					<input
						name="inputPause"
						type="number"
						placeholder="Enter the time"
						id="inputPause"
						value={data.pauseTime}
						onChange={(e: ChangeEvent<HTMLInputElement>): void =>
							setData({ ...data, pauseTime: parseInt(e.target.value) })
						}
						disabled={data.activeTimer}
					/>
				</div>

				<div className="pannello studyCycles border">
					<label htmlFor="inputCycles"> Number of study cycles </label>
					<input
						name="inputCycles"
						type="number"
						placeholder="Enter the study cycles"
						id="inputCycles"
						value={data.cycles}
						onChange={(e: ChangeEvent<HTMLInputElement>): void =>
							setData({ ...data, cycles: parseInt(e.target.value) })
						}
						disabled={data.activeTimer}
					/>
				</div>

				<div className="pannello totMinutes border">
					<label htmlFor="totMinutes"> Total minutes of study </label>
					<input
						name="totMinutes"
						type="number"
						placeholder="Enter the total minutes"
						id="totMinutes"
						value={data.totMinutes}
						onChange={(e: ChangeEvent<HTMLInputElement>): void =>
							setData({ ...data, totMinutes: parseInt(e.target.value) })
						}
						disabled={data.activeTimer}
					/>
					<button
							id="minutesButton"		//probabilmente non serve l'id
							type="button"
							className="btn btn-success"
							onClick={proposalsMinutes}
							disabled={data.activeTimer}>
							USE MINUTES
					</button>
				</div>

				<div className="pannello totHours border">
					<label htmlFor="totHours"> Total hours of study </label>
					<input
						name="totHours"
						type="number"
						placeholder="Enter the total hours"
						id="totHours"
						value={data.totHours}
						onChange={(e: ChangeEvent<HTMLInputElement>): void =>
							setData({ ...data, totHours: parseInt(e.target.value) })
						}
						disabled={data.activeTimer}
					/>
					<button
							id="hoursButton"		//probabilmente non serve l'id
							type="button"
							className="btn btn-success"
							onClick={proposalsHours}
							disabled={data.activeTimer}>
							USE HOURS
					</button>
				</div>

				<div className="create-event-container col-2">
					<h4>Organize your next Pomodoro Session</h4>
					<form>
						
						<label htmlFor="startTime">
							Data Inizio
							<div>
								<DatePicker
									className="btn border createEventinput"
									name="startTime"
									selected={pomEvent.startTime}
									onChange={(date: Date | null): void => {
										if (date) {
											// Aggiorna la data mantenendo l'orario attuale
											const newDate = new Date(pomEvent.startTime);
											newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
											setPomEvent({ ...pomEvent, startTime: newDate });
										}
									}}
								/>
							</div>

							<div>
								<input
									className="btn border createEventinput"
									type="time"
									value={`${pomEvent.startTime.getHours().toString().padStart(2, '0')}:${pomEvent.startTime.getMinutes().toString().padStart(2, '0')}`}
									onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
										const [hours, minutes] = e.target.value.split(':');
										const newDate = new Date(pomEvent.startTime); // Crea un nuovo oggetto Date basato su startTime
										newDate.setHours(Number(hours), Number(minutes), 0, 0); // Imposta l'orario
										setPomEvent({ ...pomEvent, startTime: newDate });// Imposta il nuovo oggetto Date
									}}
								/>
							</div>
						</label>

						<label htmlFor="endTime">
							Data Fine
							<div>
								<DatePicker
									className="btn border createEventinput"
									name="endTime"
									selected={pomEvent.endTime}
									onChange={(date: Date | null): void => {
										if (date) {
											// Aggiorna la data mantenendo l'orario attuale
											const newDate = new Date(pomEvent.endTime);
											newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
											setPomEvent({ ...pomEvent, endTime: newDate });
										}
									}}
								/>
							</div>

							<div>
								<input
									className="btn border createEventinput"
									type="time"
									value={`${pomEvent.endTime.getHours().toString().padStart(2, '0')}:${pomEvent.endTime.getMinutes().toString().padStart(2, '0')}`}
									onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
										const [hours, minutes] = e.target.value.split(':');
										const newDate = new Date(pomEvent.endTime);
										newDate.setHours(Number(hours), Number(minutes)); // Aggiorna l'orario
										setPomEvent({ ...pomEvent, endTime: newDate }); // Imposta il nuovo oggetto Date
									}}
								/>
							</div>
						</label>
						<label htmlFor="location">
								Luogo
								<div>
									<input
										className="btn border createEventinput"
										type="text"
										name="location"
										value={pomEvent.location}
										onChange={(e: ChangeEvent<HTMLInputElement>): void =>
											setPomEvent({ ...pomEvent, location: e.target.value })}
									/>
								</div>
						</label>
						
						<button
							className="btn btn-primary"
							style={{
								backgroundColor: "bisque",
								color: "black",
								border: "0",
							}}
							onClick={handleCreateEvent}>
							Create Event
						</button>
					</form>
				</div>

			</div>
		</>
	);
}
