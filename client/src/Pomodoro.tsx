import React from "react";

import { useState, ChangeEvent, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { SERVER_API } from "./params/params";

enum MESSAGE {
	PRESS_START = "FILL THE SPACES AND PRESS START TO BEGIN!",
	ERROR = "INSERT AN INTEGER NUMBER FOR STUDY TIME, PAUSE TIME AND STUDY CYCLES! (1-99)",
	VOID = "",
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
};

const initialState: PomodoroData = {
	studyTime: 1,
	pauseTime: 1,
	cycles: 1,
	status: STATUS.BEGIN,
	message: MESSAGE.PRESS_START,
	minutes: 0,
	seconds: 0,
	studying: false,
	activeTimer: false,
	intervalId: undefined,
};

export default function Pomodoro(): React.JSX.Element {
	const [data, setData] = useState(initialState);
	const [message, setMessage] = useState("");

	const pomodoroRef = useRef<HTMLDivElement | null>(null);

	// On page load, get the previous pomodoro sessions for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/pomodoro`);
				console.log(res);
				// TODO: set session value as response
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

	function startProcess(): void {
		if (inputCheck()) {
			//suona il campanello
			clearInterval(data.intervalId);

			const interval = setInterval(() => {
				updateTimer();
			}, 100);

			setData({
				...data,
				message: MESSAGE.VOID,
				studying: true,
				activeTimer: true,
				intervalId: interval,
				status: STATUS.STUDY,
				minutes: data.studyTime,
				seconds: 0,
				cycles: data.cycles - 1,
			});
			startAnimation();
		} else {
			setData({ ...data, message: MESSAGE.ERROR });
		}
	}

	function stopProcess(): void {
		//suona campanello
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
			var {
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

			seconds = seconds - 1;
			if (seconds < 0) {
				seconds = 59;
				minutes = minutes - 1;
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
					minutes = studying ? pauseTime : studyTime;
					seconds = 0;

					status = studying ? STATUS.PAUSE : STATUS.STUDY;

					studying = !studying;

					if (studying) cycles = cycles - 1;
					startAnimation();
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

	function startAnimation(): void {
		if (pomodoroRef.current) {
			pomodoroRef.current.classList.remove("animate-pomodoro");
			pomodoroRef.current.classList.remove("reverse-animate-pomodoro");
			if (data.studying) {
				pomodoroRef.current.style.animationDuration = `${data.studyTime * 60}s`;
				pomodoroRef.current.classList.add("animate-pomodoro");
			}

			if (!data.studying) {
				pomodoroRef.current.style.animationDuration = `${data.studyTime * 60}s`;
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

	return (
		<>
			{message && <div>{message}</div>}
			<div className="pomodoro-container">
				<header>
					<h1 id="title">POMODORO TIMER</h1>
				</header>
				<div ref={pomodoroRef} className="pomodoro">
					<img src="/images/tomato.png" alt="tomato.png" />
					<div id="timer" className="timer">
						{pad(data.minutes) + ":" + pad(data.seconds)}
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

					<div>
						<button
							id="start-button"
							type="button"
							className="btn btn-success"
							onClick={startProcess}
							disabled={data.activeTimer}>
							START
						</button>
						<button
							id="stop-button"
							type="button"
							className="btn btn-danger"
							onClick={stopProcess}
							disabled={!data.activeTimer}>
							STOP
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
			</div>
		</>
	);
}
