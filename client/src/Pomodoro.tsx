import React from "react";
import { useState, ChangeEvent, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { SERVER_API } from "./lib/params";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Pomodoro from "./types/Pomodoro";
import User from "./types/User";

import DatePicker from "react-datepicker"; //to create pomodoro events
import SearchForm from "./SearchForm";
//import SearchFormResource from "./SearchFormResource";
import Mp3Player from "./MP3Player";
import YouTubePlayer from "./YouTubePlayer";
// import UserResult from "./types/UserResult";
//import Time from "react-datepicker/dist/time";

enum PLAYER_TYPE {
	YOUTUBE = "YOUTUBE",
	SOUND = "SOUND",
}
enum MESSAGE {
	PRESS_START = "COMPILA I CAMPI E PREMI START!",
	ERROR = "INSERISCI UN NUMERO INTERO PER I MINUTI DI STUDIO, DI PAUSA E PER I CICLI! (1-99)",
	VOID = "",
	MINUTES = "INSERISCI LA DURATA IN MINUTI DELLO STUDIO (1-3465)",
	HOURS = "INSERISCI LA DURATA IN ORE DELLO STUDIO (1-57)",
}

enum STATUS {
	BEGIN = "AVVIA IL TIMER",
	STUDY = "STUDIO",
	PAUSE = "PAUSA",
	END = "FINE SESSIONE",
}

enum Frequency {
	ONCE = "once",
	DAILY = "day",
	WEEKLY = "week",
	MONTHLY = "month",
	YEARLY = "year",
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
	idEventoCondiviso: string;
	owner: string;
	title: string;
	startTime: Date;
	endTime: Date;
	untilDate: Date | null;
	isInfinite: boolean;
	frequency: string;
	location: string;
	repetitions: number;
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

const initialPomEvent: PomodoroEvent = {
	idEventoCondiviso: "",
	owner: "",
	title: "Pomodoro Session",
	startTime: new Date(),
	endTime: new Date(),
	untilDate: null,
	isInfinite: false,
	frequency: "once",
	location: "",
	repetitions: 1,
};

export default function Pomodoros(): React.JSX.Element {
	// get the value of the query parameters to initialize the pomodoro
	const [searchParams] = useSearchParams();
	const cycles = Number(searchParams.get("cycles")) || initialState.cycles;
	const studyTime = Number(searchParams.get("studyTime")) || initialState.studyTime;
	const pauseTime = Number(searchParams.get("pauseTime")) || initialState.pauseTime;

	const [data, setData] = useState({
		...initialState,
		cycles,
		studyTime,
		pauseTime,
	});

	const [pomEvent, setPomEvent] = useState(initialPomEvent);
	const [eventMessage, setEventMessage] = useState(""); // Per messaggi di errore degli eventi
	const [tomatoList, setTomatoList] = React.useState([] as Pomodoro[]); // Per pomodori recenti
	const [eventList, setEventList] = React.useState<Event[]>([]); // Per vedere gli eventi dello user attuale
	const [initialCycles, setInitialCycles] = React.useState(0); // Per calcolare i cicli rimanenti
	const [users, setUsers] = React.useState([] as string[]); // NOTA: uso un array perchè il componente SearchForm ha bisogno di un array di utenti, non un singolo utente
	const [addEvent, setAddEvent] = React.useState(false); // Per creare un evento
	//const [repeatEvent, setRepeatEvent] = React.useState(false); // Per creare un evento ripetuto
	//const [addNotification, setAddNotification] = React.useState(false);
	//const [notificationRepeat, setNotificationRepeat] = React.useState(false);
	//const [notificationTime, setNotificationTime] = React.useState(0);
	//const [notificationRepeatTime, setNotificationRepeatTime] = React.useState(0);
	//const [sendInviteEvent, setSendInviteEvent] = React.useState(false);
	//const [shareEvent, setShareEvent] = React.useState(false);
	//const [messageShareRisorsa, setMessageShareRisorsa] = React.useState("");
	//const [accessList, setAccessList] = React.useState([] as string[]);


	const [message, setMessage] = React.useState("");
	//const [until, setUntil] = React.useState(false); // Per creare un evento fino a una certa data
	//const [selectedValue, setSelectedValue] = React.useState("Data"); // Per selezionare la frequenza dell'evento
	const [shareConfig, setShareConfig] = React.useState(false); // Per condividere la configurazione del pomodoro
	const [previousPomodoros, setPreviousPomodoros] = React.useState(false); // Per vedere i pomodori recenti
	const [chooseMusic, setChooseMusic] = React.useState(false); // Per scegliere la musica

	const [playerType, setPlayerType] = useState(PLAYER_TYPE.SOUND);

	const pomodoroRef = useRef<HTMLDivElement | null>(null);

	const nav = useNavigate();

	//setup per ricevere la durata dell'evento pomodoro cliccando dall'evento sul calendario
	const location = useLocation();

	const getDurationParam = (): number => {
		const params = new URLSearchParams(location.search); // Ottieni i parametri della query
		const duration = params.get("duration"); // Leggi il parametro "duration"
		return duration ? parseInt(duration) : 0; // Restituisci la durata come numero, oppure 0 se non è definita
	};

	const getIdParam = (): string => {
		const params = new URLSearchParams(location.search); // Ottieni i parametri della query
		const id = params.get("id"); // Leggi il parametro "duration"
		return id ? id : ""; // Restituisci la durata come numero, oppure 0 se non è definita
	};

	const duration = getDurationParam(); // Ottieni la durata dal query param

	const id = getIdParam(); // Ottieni l'id dell'evento dal query param

	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/pomodoro`);
				if (res.status !== 200) {
					nav("/login");
				}
				// TODO: set session value as response
				const data = (await res.json()) as ResponseBody;

				//console.log(data);

				if (data.status === ResponseStatus.GOOD) {
					setTomatoList(data.value as Pomodoro[]);
				} else {
					console.log("Errore nel ritrovamento dei pomodoro");
				}
			} catch (e) {
				console.log("Impossibile raggiungere il server");
			}

			//Gestione della durata derivata dall'evento, se arrivo da un evento calendario imposto la sua durata come proposta
			console.log("La durata dell'evento pomodoro è: " + duration);
			if (duration !== 0) {
				proposalsMinutes(duration);
			}
		})();
	}, []);

	async function updateTomatoList(): Promise<void> {
		try {
			const res = await fetch(`${SERVER_API}/pomodoro`);
			if (res.status !== 200) {
				nav("/login");
			}
			// TODO: set session value as response
			const data = (await res.json()) as ResponseBody;

			//console.log(data);

			if (data.status === ResponseStatus.GOOD) {
				setTomatoList(data.value as Pomodoro[]);
			} else {
				console.log("Errore nel ritrovamento dei pomodoro");
			}
		} catch (e) {
			console.log("Impossibile raggiungere il server");
		}
	}

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
		updateTomatoList();
		playRing();
		setInitialCycles(data.cycles);
		clearInterval(data.intervalId);

		const interval = setInterval(() => {
			updateTimer();
		}, 1000);

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
	}

	async function handleSavePomodoroConfig(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();
		if (inputCheck()) {
			try {
				const pomodoroConfig = {
					studyTime: data.studyTime,
					pauseTime: data.pauseTime,
					cycles: data.cycles,
					owner: "",
				};
				console.log("Dati inviati al server:", pomodoroConfig);

				const res = await fetch(`${SERVER_API}/pomodoro`, {
					method: "POST",
					body: JSON.stringify(pomodoroConfig),
					headers: { "Content-Type": "application/json" },
				});

				const resBody = await res.json();

				if (resBody.status === ResponseStatus.GOOD) {
					startProcess();
					//await updateTomatoList();
				} else {
					console.log("Errore nel salvataggio della configurazione");
				}
			} catch (e) {
				console.log("Impossibile raggiungere il server");
			}
		} else {
			setData({ ...data, message: MESSAGE.ERROR });
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
		if (duration !== 0 && data.cycles > 0) handleLeftTime(); // Se arrivo da un evento e non ho finito i cicli previsti
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

	function handleLeftTime(): void {
		(async (): Promise<void> => {
			try {
				// Dalla durata totale elimino i cicli completati
				const timeToAdd =
					duration - (data.studyTime + data.pauseTime) * (initialCycles - data.cycles);
				console.log("timeToAdd:", timeToAdd);

				if (timeToAdd >= 30) {
					const currentUser = await getCurrentUser();
					const owner = currentUser.value._id.toString();
					const res = await fetch(`${SERVER_API}/events/owner?owner=${owner}`);
					const date = await res.json();
					console.log("Eventi trovati nella handleLeftTime:", data);
					console.log("Eventi trovati nella handleLeftTime:", data);
					console.log("Eventi trovati nella handleLeftTime:", data);
					console.log("Eventi trovati nella handleLeftTime:", data);
					console.log("Eventi trovati nella handleLeftTime:", data);


					// Creo una variabile per il pomodoro attuale
					const currentPomodoro = date.value.find((event: any) => {
						const eventId = event._id;
						return eventId === id;
					});
					const CurPomStartTime = new Date(currentPomodoro.startTime);
					const FixedCurPomStartTime = new Date(
						CurPomStartTime.getTime() + CurPomStartTime.getTimezoneOffset() * 60000
					);

					if (date.status === ResponseStatus.GOOD) {
						console.log("ENTRO NELL'IF");
						console.log("ENTRO NELL'IF");

						console.log("ENTRO NELL'IF");

						console.log("ENTRO NELL'IF");
						console.log("ENTRO NELL'IF");
						console.log("ENTRO NELL'IF");
						console.log("ENTRO NELL'IF");
						console.log("ENTRO NELL'IF");
						console.log("ENTRO NELL'IF");

						setEventList(date.value);
						console.log(eventList); // Senza questa riga c'è un warning
						console.log("stampo data.values:", date.value);

						// Filtra solo gli eventi "Pomodoro Session" successivi all'orario di inizio del pomodoro attuale
						const eventPomodoro = date.value.find((event: any) => {
							const eventStartTime = new Date(event.startTime); // Converto l'orario di inizio in Date per la comparazione
							const eventId = event._id;
							return (
								event.title === "Pomodoro Session" &&
								eventStartTime > FixedCurPomStartTime &&
								eventId !== id
							);
						});

						if (!eventPomodoro) {
							console.log(
								"Nessun evento 'Pomodoro Session' trovato che soddisfi i criteri."
							);

							const newStartTime = new Date(currentPomodoro.startTime); // Usa lo stesso orario di inizio dell'evento attuale
							const newEndTime = new Date(newStartTime);
							newEndTime.setMinutes(newEndTime.getMinutes() + timeToAdd); // Calcolo l'orario di fine evento in base al tempo rimanente

							// Correggo il fuso orario degli orari
							const correctedStartTime = new Date(
								newStartTime.getTime() + newStartTime.getTimezoneOffset() * 60000
							);
							const correctedEndTime = new Date(
								newEndTime.getTime() + newEndTime.getTimezoneOffset() * 60000
							);

							// Imposto al giorno successivo il nuovo evento
							correctedStartTime.setDate(correctedStartTime.getDate() + 1);
							correctedEndTime.setDate(correctedEndTime.getDate() + 1);

							const res = await fetch(`${SERVER_API}/events`, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								// Nel body utilizzo lo stesso owner, startTime e location della Pomodoro Session attuale
								body: JSON.stringify({
									owner: currentPomodoro.owner,
									title: "Pomodoro Session",
									startTime: correctedStartTime.toISOString(),
									endTime: correctedEndTime.toISOString(),
									location: currentPomodoro.location,
									frequency: Frequency.ONCE,
									untilDate: null,
									isInfinite: false,
									repetitions: 1,
								}),
							});

							if (res.ok) {
								console.log("Nuovo evento 'Pomodoro Session' creato con successo.");
							} else {
								console.log("Errore nella creazione del nuovo evento.");
							}
						} else if (eventPomodoro) {
							console.log(
								"Trovato un evento 'Pomodoro Session' successivo all'orario attuale:",
								eventPomodoro
							);

							// Aggiungere il tempo rimanente all'evento trovato
							const updatedEndTime = new Date(eventPomodoro.endTime);
							updatedEndTime.setMinutes(updatedEndTime.getMinutes() + timeToAdd);

							// Effettuare una richiesta PUT per aggiornare l'evento
							const updateRes = await fetch(
								`${SERVER_API}/events/${eventPomodoro._id}`,
								{
									method: "PUT",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										...eventPomodoro,
										endTime: updatedEndTime,
									}),
								}
							);
							if (updateRes.ok) {
								console.log(
									"Evento aggiornato correttamente con il tempo rimanente."
								);
							} else {
								console.log("Errore nell'aggiornamento dell'evento.");
							}
						}
					} else {
						console.log("Errore nel ritrovamento degli eventi");
					}
				} else {
					alert(
						"Il tempo rimanente è minore di 30 minuti, non è possibile creare un nuovo pomodoro."
					);
				}
			} catch (e) {
				console.log("Impossibile raggiungere il server");
			}
		})();
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
		} else {
			nextPhase();
		}
	}

	function repeatCycle(): void {
		setData((prevData) => {
			let { minutes, seconds, cycles, studyTime, studying, status } = prevData;

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

	function proposalsMinutes(inputMinutes?: number): void {
		setData((prevData) => {
			let { cycles, studyTime, totMinutes, pauseTime, message } = prevData;

			if (inputMinutes !== undefined) {
				totMinutes = inputMinutes;
			}

			if (totMinutes <= 0 || totMinutes > 3465) {
				setData({ ...data, message: MESSAGE.MINUTES });
			} else {
				if (totMinutes % 30 === 0) {
					studyTime = 25;
					pauseTime = 5;
					cycles = Math.floor(totMinutes / 30);
				} else if (totMinutes < 90) {
					const divBy12 = Math.floor(totMinutes / 12);
					const decimalMultiplied = (totMinutes / 12 - divBy12) * 100;

					studyTime = (decimalMultiplied > 50 ? divBy12 + 1 : divBy12) * 5;
					pauseTime =
						decimalMultiplied === 0
							? divBy12
							: divBy12 + (decimalMultiplied <= 50 ? 1 : 0);

					cycles = 2;
				} else if (totMinutes > 90 && totMinutes < 135) {
					const divBy18 = Math.floor(totMinutes / 18);
					const decimalMultiplied = (totMinutes / 18 - divBy18) * 100;

					studyTime = (decimalMultiplied > 50 ? divBy18 + 1 : divBy18) * 5;
					pauseTime =
						decimalMultiplied === 0
							? divBy18
							: divBy18 + (decimalMultiplied <= 50 ? 1 : 0);

					cycles = 3;
				} else if (totMinutes >= 135 && totMinutes < 180) {
					const divBy24 = Math.floor(totMinutes / 24);
					const decimalMultiplied = (totMinutes / 24 - divBy24) * 100;

					studyTime = (decimalMultiplied > 50 ? divBy24 + 1 : divBy24) * 5;
					pauseTime =
						decimalMultiplied === 0
							? divBy24
							: divBy24 + (decimalMultiplied <= 50 ? 1 : 0);

					cycles = 4;
				} else if (totMinutes > 180 && totMinutes < 225) {
					const divBy30 = Math.floor(totMinutes / 30);
					const decimalMultiplied = (totMinutes / 30 - divBy30) * 100;

					studyTime = (decimalMultiplied > 50 ? divBy30 + 1 : divBy30) * 5;
					pauseTime =
						decimalMultiplied === 0
							? divBy30
							: divBy30 + (decimalMultiplied <= 50 ? 1 : 0);

					cycles = 5;
				} else if (totMinutes >= 225 && totMinutes < 270) {
					const divBy36 = Math.floor(totMinutes / 36);
					const decimalMultiplied = (totMinutes / 36 - divBy36) * 100;

					studyTime = (decimalMultiplied > 50 ? divBy36 + 1 : divBy36) * 5;
					pauseTime =
						decimalMultiplied === 0
							? divBy36
							: divBy36 + (decimalMultiplied <= 50 ? 2 : 0);

					cycles = 6;
				} else if (totMinutes > 270 && totMinutes < 315) {
					const divBy42 = Math.floor(totMinutes / 42);
					const decimalMultiplied = (totMinutes / 42 - divBy42) * 100;

					studyTime = (decimalMultiplied > 50 ? divBy42 + 1 : divBy42) * 5;
					pauseTime =
						decimalMultiplied === 0
							? divBy42
							: divBy42 + (decimalMultiplied <= 50 ? 2 : 0);

					cycles = 7;
				} else {
					studyTime = 30;
					pauseTime = 5;
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
			let { cycles, message, studyTime, pauseTime, totHours, totMinutes } = prevData;

			totMinutes = totHours * 60;
			if (totMinutes <= 0 || totMinutes > 3465) {
				setData({ ...data, message: MESSAGE.HOURS });
			} else {
				studyTime = 25;
				pauseTime = 5;
				cycles = Math.floor(totMinutes / 30);
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
			setEventMessage("TUTTI I CAMPI DEVONO ESSERE COMPILATI!");
			return;
		}

		if (pomEvent.startTime > pomEvent.endTime) {
			setEventMessage("L'INIZIO DELL'EVENTO NON DEVE ESSERE SUCCESSIVO ALLA SUA FINE!");
			return;
		}

		const start = new Date(pomEvent.startTime).getTime();
		const end = new Date(pomEvent.endTime).getTime();

		//l'evento che creo dura almeno 30 minuti?
		if ((end - start) / (1000 * 60) < 30) {
			setEventMessage("LA DURATA DEVE ESSERE DI ALMENO 30 MINUTI");
			return;
		}

		const currentUser = await getCurrentUser();
		const owner = currentUser.value._id.toString();
		const idEventoNotificaCondiviso = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

		const res = await fetch(`${SERVER_API}/events`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				idEventoNotificaCondiviso,
				owner: owner,
				title: pomEvent.title,
				startTime: pomEvent.startTime.toISOString(),
				endTime: pomEvent.endTime.toISOString(),
				accessList: [], // Usa uniqueAccessList invece di accessList
				accessListAccepted: [owner],
				untilDate: pomEvent.untilDate,
				isInfinite: pomEvent.isInfinite,
				frequency: pomEvent.frequency,
				repetitions: pomEvent.repetitions,
				location: pomEvent.location,
			}),
		});

		console.log(pomEvent.title, pomEvent.startTime, pomEvent.endTime, pomEvent.location);

		if (!res.ok) {
			const errorData = await res.json();
			console.error("Error response:", errorData);
			setEventMessage("Errore durante la creazione dell'evento: " + errorData.message);
			return;
		}

		const data: ResponseBody = (await res.json()) as ResponseBody;

		setEventMessage(data.message || "Undefined error");

		window.location.reload();

		// TODO: send post request to server
		// TODO: handle response
	}

	async function getCurrentUser(): Promise<Promise<any> | null> {
		try {
			const res = await fetch(`${SERVER_API}/users`);
			if (!res.ok) {
				// Controlla se la risposta non è ok
				console.log("Utente non autenticato");
				return null; // Restituisci null se non autenticato
			}
			console.log("Questa è la risposta alla GET per ottenere lo user", res);
			const data: User = await res.json();
			console.log("Questo è il json della risposta", data);
			return data;
		} catch (e) {
			console.log("Impossibile recuperare l'utente corrente");
			return null;
		}
	}

	function handleSelectUser(e: React.ChangeEvent<HTMLSelectElement>, username: string): void {
		e.preventDefault();
		setUsers([username]);
	}

	async function handleSendInvite(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();
		if (!(users.length > 0)) {
			setMessage("Nessun utente selezionato");
			return;
		}

		const res = await fetch(`${SERVER_API}/pomodoro/notifications`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				receiver: users[0],
				cycles: data.cycles,
				studyTime: data.studyTime,
				pauseTime: data.pauseTime,
			}),
		});

		const resBody: ResponseBody = (await res.json()) as ResponseBody;

		if (resBody.status === ResponseStatus.GOOD) {
			console.log("Invito inviato correttamente");
			setUsers([]);
		} else {
			alert(resBody.message);
		}
	}

	function toggleAddEvent(): void {
		setAddEvent(!addEvent);
		//setRepeatEvent(false);
		//setAddNotification(false);
		//setShareEvent(false);
		//setSendInviteEvent(false);
		//setNotificationRepeat(false);
		//setNotificationRepeatTime(0);
		//setUntil(false);
		//setFrequency(Frequency.ONCE);
		setUsers([]);
		//setAccessList([]);
		//setMessageShareRisorsa("");
		//setSelectedValue("Data");
		pomEvent.untilDate = null;
		pomEvent.location = "";
		pomEvent.isInfinite = false;
	}

	{/*function toggleSelectFrequency(e: React.ChangeEvent<HTMLSelectElement>): void {
		setPomEvent((prevPomEvent) => {
			let { frequency, untilDate } = prevPomEvent;
			console.log("toggleSelectFrequency", e.target.value);
			const frequenza = e.target.value;
			if (frequenza !== "Once") {
				toggleUntil(frequenza);
			}
			if (frequenza === "Once") {
				frequency = Frequency.ONCE;
				setUntil(false);
			}
			switch (frequenza) {
				case "Daily":
					frequency = Frequency.DAILY;
					break;
				case "Weekly":
					frequency = Frequency.WEEKLY;
					break;
				case "Monthly":
					frequency = Frequency.MONTHLY;
					break;
				case "Yearly":
					frequency = Frequency.YEARLY;
					break;
			}
			return {
				...prevPomEvent,
				frequency,
				untilDate,
			} as PomodoroEvent;
		});
	}

	function toggleUntil(selectedValue: string): void {
		console.log("toggleUntil", selectedValue);
		setUntil(true);
	}

	function toggleSelectUntil(e: React.ChangeEvent<HTMLSelectElement>): void {
		setPomEvent((prevPomEvent) => {
			let { isInfinite } = prevPomEvent;
			const valoreSelezionato = e.target.value;
			console.log("toggleSelectUntil", valoreSelezionato);
			switch (valoreSelezionato) {
				case "Data":
					console.log("selezionato data");
					isInfinite = false;
					setSelectedValue("Data");

					break;
				case "Ripetizioni":
					console.log("selezionato ripetizioni");
					isInfinite = false;
					setSelectedValue("Ripetizioni");
					break;
				case "Infinito":
					console.log("selezionato infinito");
					setSelectedValue("Infinito");
					isInfinite = true;
					break;
			}
			return {
				...prevPomEvent,
				isInfinite,
			} as PomodoroEvent;
		});
	}*/}

	function togglePreviousPomodoros(): void {
		setPreviousPomodoros(!previousPomodoros);
	}

	function toggleShareConfig(): void {
		setShareConfig(!shareConfig);
	}

	function toggleChooseMusic(): void {
		setChooseMusic(!chooseMusic);
	}
	{/*
	function toggleAddNotification(): void {
		setAddNotification(!addNotification);
		if (notificationRepeat === true) {
			setNotificationRepeat(false);
		}
	}

	const getValidRepeatOptions = (time: number): number[] => {
		const options = [0, 5, 10, 15, 30, 60, 120, 1440]; // Opzioni disponibili
		return options.filter((option) => option !== time && (time % option === 0 || option === 0)); // Filtra solo i divisori, escludendo il numero stesso
	};

	function toggleSendInviteEvent(): void {
		setSendInviteEvent(!sendInviteEvent);
	}

	async function handleSendInviteEvent(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();
		if (!(users.length > 0)) {
			setMessage("Nessun utente selezionato");
			return;
		}
		console.log("ENTRO NELLA HANDLESENDINVITE");
		console.log("ENTRO NELLA HANDLESENDINVITE");
		console.log("Questo è il receiver:", users[0]);

		//const currentUser = await getCurrentUser();

		//const ownerr = currentUser.value.username;

		const idEventoNotificaCondiviso = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

		let newNotification;
		const res = await fetch(`${SERVER_API}/users/getIdByUsername?username=${users[0]}`);
		const data = await res.json();
		const receiver = data.id;

		if (addNotification) {
			const notificationDate = new Date(pomEvent.startTime);
			notificationDate.setMinutes(notificationDate.getMinutes() - notificationTime);
			console.log("Questa è la data di inizio evento:", pomEvent.startTime);
			console.log("Questa è la data della notifica:", notificationDate);
			var message = "";
			if (notificationTime < 60) {
				message = "Inizio evento " + pomEvent.title + " tra " + notificationTime + " minuti!";
			} else {
				message = "Inizio evento " + pomEvent.title + " tra " + notificationTime / 60 + " ore!";
			}

			if (notificationTime == 0) {
				message = "Evento " + pomEvent.title + " iniziato!";
			}

			var repeatTime = notificationRepeatTime;
			var repeatedNotification = false;
			if (repeatTime > 0) {
				repeatedNotification = true;
			}

			newNotification = {
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
					frequencyEvent: pomEvent.frequency,
					isInfiniteEvent: pomEvent.isInfinite,
					repetitionsEvent: pomEvent.repetitions,
					untilDateEvent: pomEvent.untilDate,
				},
			};
		}

		const newEvent = {
			idEventoNotificaCondiviso,
			owner: receiver,
			title: pomEvent.title,
			startTime: pomEvent.startTime.toISOString(),
			endTime: pomEvent.endTime.toISOString(),
			untilDate: pomEvent.untilDate,
			isInfinite: pomEvent.isInfinite,
			frequency: pomEvent.frequency,
			location: pomEvent.location,
			repetitions: pomEvent.repetitions,
		};

		const res3 = await fetch(`${SERVER_API}/notifications`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: "Hai ricevuto un invito per un evento",
				mode: "event",
				receiver: receiver,
				type: "message",
				data: {
					date: new Date(), //data prima notifica
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

		//toggleCreateEvent();
		setSendInviteEvent(false);
	}

	function toggleCreateEvent(): void {
		if (!createEvent) {
			// Usa l'ora corrente o l'ora di startTime
			const currentHours = startTime.getHours();
			const currentMinutes = startTime.getMinutes();
			const endHours = endTime.getHours();
			const endMinutes = endTime.getMinutes();

			// Imposta startTime con day, meseCorrente, year e l'ora corrente
			var initialStartTime = new Date(
				year,
				meseCorrente,
				day,
				currentHours,
				currentMinutes,
				0,
				0
			);
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
		setShareEvent(false);
		setAllDayEvent(false);
		setSendInviteEvent(false);
		setNotificationRepeat(false);
		setNotificationRepeatTime(0);
		setUntil(false);
		setTitle("");
		setLocation("");
		setCreateEvent(!createEvent);
		setFrequency(Frequency.ONCE);
		setUsers([]);
		setAccessList([]);
		setMessageEvent("");
		setMessageActivity("");
		setMessageNotDisturb("");
		setMessageRisorsa("");
		setMessageShareRisorsa("");
	}

	function toggleShareEvent(): void {
		setShareEvent(!shareEvent);
	}

	async function handleAddUserEvent(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();
		console.log("Utente ", users[0], " aggiunto all'access list dell'evento");
		const res = await fetch(`${SERVER_API}/users/getIdByUsername?username=${users[0]}`);
		const data = await res.json();
		const idUser = data.id;

		const risorsa = users[0];
		const startTime = pomEvent.startTime;
		const endTime = pomEvent.endTime;

		const resRisorsa = await fetch(`${SERVER_API}/risorsa/checkResourceAvailability`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ risorsa, startTime, endTime }),
		});
		const dataRisorsa = await resRisorsa.json();
		if (!dataRisorsa.isAvailable) {
			//alert("La risorsa non è disponibile per l'orario selezionato");
			setMessageShareRisorsa("Risorsa non disponibile!");
			return;
		} else {
			setMessageShareRisorsa("");
		}
		setAccessList([...accessList, idUser]);
	}*/}

	return (
		<>
			<audio id="ring" src="/images/ring.mp3"></audio>
			<div className="pomodoro-page-container">
				{addEvent ? (
					<div className="create-event-container">
						<form>
							<h4 style={{ textAlign: "center" }}>
								CREA UN EVENTO POMODORO
							</h4>
							<button
								className="btn btn-primary"
								style={{
									backgroundColor: "bisque",
									color: "black",
									border: "0",
								}}
								onClick={toggleAddEvent}>
								Chiudi
							</button>

							{/*<label htmlFor="allDayEvent">
								<input
									type="checkbox"
									name="repeatEvent"
									onClick={(): void => {
										setRepeatEvent(!repeatEvent);
										setUntil(false);
									}}
									style={{
										marginLeft: "5px",
										marginRight: "3px",
										marginTop: "3px",
									}}
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
												style={{
													marginLeft: "5px",
													marginRight: "3px",
													marginTop: "3px",
												}}>
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
												<div
													className="flex"
													style={{ marginRight: "10px" }}>
													Fino a
													<select
														className="btn border"
														onChange={toggleSelectUntil}
														defaultValue="Data"
														style={{ border: "1px solid black" }}>
														<option value="Data">
															Data
														</option>
														<option value="Ripetizioni">
															Ripetizioni
														</option>
														<option value="Infinito">
															Infinito
														</option>
													</select>
												</div>

												{selectedValue === "Data" && (
													<DatePicker
														className="btn border"
														name="finoAData"
														selected={pomEvent.untilDate} // Il DatePicker sarà vuoto se untilDate è null
														onChange={(date: Date | null): void => {
															if (date) {
																date.setHours(12, 0, 0, 0); // Imposta l'orario a mezzogiorno
																setPomEvent({
																	...pomEvent,
																	untilDate: date,
																});
															}
														}}
														placeholderText="Seleziona una data"
													/>
												)}

												{selectedValue === "Ripetizioni" && (
													<div>
														<input
															className="btn border"
															type="number"
															min="1"
															onChange={(
																e: React.ChangeEvent<HTMLInputElement>
															): void => {
																setPomEvent({
																	...pomEvent,
																	repetitions: Number(
																		e.target.value
																	),
																});
																setPomEvent({
																	...pomEvent,
																	untilDate: null,
																});

																if (
																	pomEvent.repetitions < 1 ||
																	isNaN(pomEvent.repetitions)
																) {
																	setPomEvent({
																		...pomEvent,
																		repetitions: 1,
																	});
																}
																console.log(
																	"Numero ripetizione dell'evento: ",
																	pomEvent.repetitions
																);
															}}></input>
													</div>
												)}
											</div>
										</div>
									)}
								</>
							)}*/}

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
												newDate.setFullYear(
													date.getFullYear(),
													date.getMonth(),
													date.getDate()
												);
												setPomEvent({
													...pomEvent,
													startTime: newDate,
												});
											}
										}}
									/>
								</div>
								<div>
									<input
										className="btn border createEventinput"
										type="time"
										value={`${pomEvent.startTime
											.getHours()
											.toString()
											.padStart(2, "0")}:${pomEvent.startTime
												.getMinutes()
												.toString()
												.padStart(2, "0")}`}
										onChange={(
											e: React.ChangeEvent<HTMLInputElement>
										): void => {
											const [hours, minutes] = e.target.value.split(":");
											const newDate = new Date(pomEvent.startTime); // Crea un nuovo oggetto Date basato su startTime
											newDate.setHours(
												Number(hours),
												Number(minutes),
												0,
												0
											); // Imposta l'orario
											setPomEvent({
												...pomEvent,
												startTime: newDate,
											}); // Imposta il nuovo oggetto Date
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
												newDate.setFullYear(
													date.getFullYear(),
													date.getMonth(),
													date.getDate()
												);
												setPomEvent({
													...pomEvent,
													endTime: newDate,
												});
											}
										}}
									/>
								</div>
								<div>
									<input
										className="btn border createEventinput"
										type="time"
										value={`${pomEvent.endTime
											.getHours()
											.toString()
											.padStart(2, "0")}:${pomEvent.endTime
												.getMinutes()
												.toString()
												.padStart(2, "0")}`}
										onChange={(
											e: React.ChangeEvent<HTMLInputElement>
										): void => {
											const [hours, minutes] = e.target.value.split(":");
											const newDate = new Date(pomEvent.endTime);
											newDate.setHours(Number(hours), Number(minutes)); // Aggiorna l'orario
											setPomEvent({
												...pomEvent,
												endTime: newDate,
											}); // Imposta il nuovo oggetto Date
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
											setPomEvent({
												...pomEvent,
												location: e.target.value,
											})
										}
									/>
								</div>
							</label>
							{/*
							<label htmlFor="allDayEvent">
								<input
									type="checkbox"
									name="addNotification"
									onClick={toggleAddNotification}
									style={{
										marginLeft: "5px",
										marginRight: "3px",
										marginTop: "3px",
									}}
								/>
								Aggiungi notifica
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
											} else if (Number(e.target.value) === 0) {
												setNotificationRepeat(false);
											}
										}}
										style={{ marginLeft: "10px" }} // Aggiungi margine se necessario
									>
										{pomEvent.isInfinite ? (
											<option value="0">All'ora d'inizio</option> // Solo questa opzione se isInfinite è true
										) : (
											<>
												<option value="0">
													All'ora d'inizio
												</option>
												<option value="5">
													5 minuti prima
												</option>
												<option value="10">
													10 minuti prima
												</option>
												<option value="15">
													15 minuti prima
												</option>
												<option value="30">
													30 minuti prima
												</option>
												<option value="60">1 ora prima</option>
												<option value="120">2 ore prima</option>
												<option value="1440">
													Un giorno prima
												</option>
												<option value="2880">
													2 giorni prima
												</option>
											</>
										)}
									</select>
								</label>
							)}

							{notificationRepeat && !pomEvent.isInfinite && (
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

							<label htmlFor="allDayEvent">
								<input
									type="checkbox"
									onClick={toggleSendInviteEvent}
									style={{
										marginLeft: "5px",
										marginRight: "3px",
										marginTop: "3px",
									}}
								/>
								Invia evento ad utente
							</label>

							{sendInviteEvent && (
								<div
									id="send-invite"
									className="send-invite-container"
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										justifyContent: "center",
									}}>
									<div>
										Scegli l'utente al quale inviare la notifica
									</div>
									{users.length > 0}
									<SearchForm
										onItemClick={handleSelectUser}
										list={users}
									/>
									{message && <div className="error-message">{message}</div>}
									<button
										onClick={handleSendInviteEvent}
										className="btn btn-primary send-invite-button"
										style={{
											backgroundColor: "bisque",
											color: "black",
											border: "0",
											marginBottom: "10px",
										}}>
										Invia Invito
									</button>
								</div>
							)}

							<label htmlFor="allDayEvent">
								<input
									type="checkbox"
									onClick={toggleShareEvent}
									style={{
										marginLeft: "5px",
										marginRight: "3px",
										marginTop: "3px",
									}}
								/>
								Condividi evento
							</label>

							{shareEvent && (
								<div
									id="send-invite"
									className="send-invite-container"
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										justifyContent: "center",
									}}>
									<div style={{ textAlign: "center" }}>
										Scegli l'utente o la risorsa con cui condividere
										l'evento
									</div>
									{users.length > 0}
									<SearchFormResource
										onItemClick={handleSelectUser}
										list={users}
									/>
									{messageShareRisorsa && (
										<div className="error-message">
											{messageShareRisorsa}
										</div>
									)}

									<button
										onClick={handleAddUserEvent}
										className="btn btn-primary send-invite-button"
										style={{
											backgroundColor: "bisque",
											color: "black",
											border: "0",
											marginBottom: "10px",
										}}>
										Condividi
									</button>
								</div>
							)}*/}
							{eventMessage && (
								<div className="error-message">
									{eventMessage}
								</div>
							)}
							<button
								className="btn btn-primary"
								style={{
									backgroundColor: "bisque",
									color: "black",
									border: "0",
								}}
								onClick={handleCreateEvent}>
								Crea evento
							</button>
						</form>
					</div>
				) : (
					<>

						<div className="top-container">
							<div className="actions-container">
								<header>
									<h1 className="title">POMODORO TIMER</h1>
								</header>

								<div className="buttons-container">
									<button
										className="add-event-button"
										onClick={toggleAddEvent}
										disabled={data.activeTimer}>
										Crea evento Pomodoro
									</button>
									<button
										className="previous-pomodoros-button"
										onClick={togglePreviousPomodoros}>
										Visualizza ultimi Pomodoro
									</button>
									<button className="share-config-button" onClick={toggleShareConfig}>
										<a style={{ textDecoration: "none", color: "inherit" }}>
											Condividi configurazione
										</a>
									</button>
									<button className="music-button" onClick={toggleChooseMusic}>
										Scegli la tua musica
									</button>
								</div>

								<div
									className="preview"
									style={{ display: previousPomodoros ? "flex" : "none" }}>
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
											}>
											{pomodoro.studyTime} min - {pomodoro.pauseTime} min -{" "}
											{pomodoro.cycles} cicli
											<br />
										</button>
									))}
								</div>

								<div
									className="send-invite-container"
									style={{ display: shareConfig ? "block" : "none" }}>
									<div style={{ marginBottom: "10px", fontWeight: "bold" }}>
										Invia la configurazione del Pomodoro ad un amico
									</div>
									{users.length > 0}
									<SearchForm onItemClick={handleSelectUser} list={users} />
									{message && <div className="error-message">{message}</div>}
									<button
										onClick={handleSendInvite}
										className="btn btn-primary send-invite-button"
										style={{
											backgroundColor: "lightcoral",
											color: "white",
											border: "0",
										}}>
										Invia Invito
									</button>
								</div>

								<div
									className="music-container"
									style={{ display: chooseMusic ? "block" : "none" }}>
									<select
										value={playerType}
										onChange={(e): void =>
											setPlayerType(e.target.value as PLAYER_TYPE)
										}>
										<option value={PLAYER_TYPE.SOUND}>Mp3</option>
										<option value={PLAYER_TYPE.YOUTUBE}>YouTube</option>
									</select>
									{playerType === PLAYER_TYPE.SOUND ? (
										<>
											<Mp3Player />
										</>
									) : (
										<YouTubePlayer />
									)}
								</div>
							</div>
						</div>

						<div className="body-container">
							<div className="pomodoro-container">
								<div ref={pomodoroRef} className="pomodoro">
									<img src="/images/tomato.png" alt="tomato.png" />
									<div className="timer">
										{data.activeTimer
											? `${pad(data.minutes)}:${pad(data.seconds)}`
											: ""}
									</div>
								</div>

								<div>
									<h4 className="status">{data.status}</h4>

									<div>
										<button
											type="button"
											className="btn btn-success start-button"
											onClick={handleSavePomodoroConfig}
											disabled={data.activeTimer}>
											START
										</button>

										<button
											type="button"
											className="btn btn-danger stop-button"
											onClick={stopProcess}
											disabled={!data.activeTimer}>
											STOP
										</button>
									</div>

									<br />

									<div className="commands-container" style={{ width: "100%" }}>
										<button
											type="button"
											className="bg-warning skip-phase-button"
											onClick={nextPhase}
											disabled={!data.activeTimer}>
											SALTA FASE
										</button>

										<button
											type="button"
											className="bg-warning skip-cycle-button"
											onClick={nextCycle}
											disabled={!data.activeTimer}>
											SALTA CICLO
										</button>

										<button
											type="button"
											className="bg-warning repeat-cycle-button"
											onClick={repeatCycle}
											disabled={!data.activeTimer}>
											RIPETI CICLO
										</button>
									</div>
								</div>
							</div>

							<div className={addEvent ? "hidden" : "config-container"}>
								<div className="paragraph">{data.message}</div>

								<div className="pannello studyTime">
									<label htmlFor="inputStudy">Minuti di studio</label>
									<input
										name="inputStudy"
										type="number"
										placeholder="Enter the time"
										className="inputStudyTime"
										id="inputStudy"
										value={data.studyTime}
										onChange={(e: ChangeEvent<HTMLInputElement>): void =>
											setData({
												...data,
												studyTime: parseInt(e.target.value),
											})
										}
										disabled={data.activeTimer}
									/>
								</div>

								<div className="pannello breakTime">
									<label htmlFor="inputPause">Minuti di pausa</label>
									<input
										name="inputPause"
										type="number"
										placeholder="Enter the time"
										id="inputPause"
										value={data.pauseTime}
										onChange={(e: ChangeEvent<HTMLInputElement>): void =>
											setData({
												...data,
												pauseTime: parseInt(e.target.value),
											})
										}
										disabled={data.activeTimer}
									/>
								</div>

								<div className="pannello studyCycles">
									<label htmlFor="inputCycles">Numero di cicli</label>
									<input
										name="inputCycles"
										type="number"
										placeholder="Enter the study cycles"
										id="inputCycles"
										value={data.cycles}
										onChange={(e: ChangeEvent<HTMLInputElement>): void =>
											setData({
												...data,
												cycles: parseInt(e.target.value),
											})
										}
										disabled={data.activeTimer}
									/>
								</div>

								<div className="pannello totMinutes">
									<label htmlFor="totMinutes">Minuti totali</label>
									<input
										name="totMinutes"
										type="number"
										placeholder="Enter the total minutes"
										value={data.totMinutes}
										onChange={(e: ChangeEvent<HTMLInputElement>): void => {
											setData({
												...data,
												totMinutes: parseInt(e.target.value),
											});
											proposalsMinutes();
										}}
										disabled={data.activeTimer}
									/>
								</div>

								<div className="pannello totHours">
									<label htmlFor="totHours">Ore totali</label>
									<input
										name="totHours"
										type="number"
										placeholder="Enter the total hours"
										value={data.totHours}
										onChange={(e: ChangeEvent<HTMLInputElement>): void => {
											setData({
												...data,
												totHours: parseInt(e.target.value),
											});
											proposalsHours();
										}}
										disabled={data.activeTimer}
									/>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</>
	);
}
