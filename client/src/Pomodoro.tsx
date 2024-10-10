import React from "react";
import { useState, ChangeEvent, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { SERVER_API } from "./params/params";
import { useNavigate } from "react-router-dom";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Pomodoro from "./types/Pomodoro";

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
	const [message, setMessage] = useState("");
	const [tomatoList, setTomatoList] = React.useState([] as Pomodoro[]);

	const pomodoroRef = useRef<HTMLDivElement | null>(null);

	const nav = useNavigate();
	

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
		})();
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

	//ciaoo



	return (
		<>
			{message && <div>{message}</div>}
			<audio id="ring" src="/images/ring.mp3"></audio>
			<div className="pomodoro-container">
				<header>
					<h1 id="title" style={{ color: "white", fontWeight: "bold" }}>POMODORO TIMER</h1>
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
							className="btn btn-success"
							onClick={handleSavePomodoroConfig}
							disabled={data.activeTimer}>
							START
						</button>
						<button
							id="stop-button"		//probabilmente non serve l'id
							type="button"
							className="btn btn-danger"
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
							className="btn btn-warning"
							onClick={nextPhase}
							disabled={!data.activeTimer}>
							NEXT PHASE
						</button>
						<button
							id="next-button"		//probabilmente non serve l'id
							type="button"
							className="btn btn-warning"
							onClick={nextCycle}
							disabled={!data.activeTimer}>
							NEXT CYCLE
						</button>
						<button
							id="next-button"		//probabilmente non serve l'id
							type="button"
							className="btn btn-warning"
							onClick={repeatCycle}
							disabled={!data.activeTimer}>
							REPEAT CYCLE
						</button>
					</div>

					<p className="paragraph">{data.message}</p>
				</div>

				<div className="pannello studyTime">
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

				<div className="pannello breakTime">
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
				<div className="pannello studyCycles">
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
				<div className="pannello totMinutes">
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
				<div className="pannello totHours">
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
			</div>
		</>
	);
}
