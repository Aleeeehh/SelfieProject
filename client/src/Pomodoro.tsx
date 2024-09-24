import React from "react";
import { useState , ChangeEvent , useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Pomodoro(): React.JSX.Element {
	const [message, setMessage] = useState("caricamento in corso");

	const [studyTime, setStudyTime] = useState(0);
	const [pauseTime, setPauseTime] = useState(0);
	const [cycles, setCycles] = useState(0);
	const [paragraph, setParagraph] = useState("FILL THE SPACES AND PRESS START TO BEGIN!");
	const [timer, setTimer] = useState("");
	const [minutes, setMinutes] = useState(0);
	const [seconds, setSeconds] = useState(0);
	const [status, setStatus] = useState("BEGIN SESSION!");
	const [isStudySession, setIsStudySession] = useState(false);
	const [isStopDisabled, setIsStopDisabled] = useState(true);
	const [isStartDisabled, setIsStartDisabled] = useState(false);
	const [isStudyboxDisabled, setIsStudyboxDisabled] = useState(false);
	const [isPauseboxDisabled, setIsPauseboxDisabled] = useState(false);
	const [isCyclesboxDisabled, setIsCyclesboxDisabled] = useState(false);

	const pomodoroRef = useRef<HTMLDivElement | null>(null);





	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch("http://localhost:3002/api/pomodoro");
				console.log(res);
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	function initData(): void{
		setMinutes(studyTime);
		setSeconds(0);
		updateTimerText();
		console.log(minutes);
	}

	function inputCheck(): boolean {
		if (studyTime <= 0 || studyTime > 99 || 
			pauseTime <= 0 || pauseTime > 99 ||
			   cycles <= 0 || cycles > 99) {
				setParagraph("INSERT AN INTEGER NUMBER FOR STUDY TIME, PAUSE TIME AND STUDY CYCLES! (1-99)");
				return false;
			}
		else {
				return true;
			}
	}

	function startProcess(): void {
		if (inputCheck()){
			//suona il campanello
			setParagraph("");
			startTimer();
			startAnimation();
		}
	}

	function stopProcess(): void {
		//suona campanello
		stopTimer();
	}

	function startTimer(): void {
		setIsStudySession(true);
		disableInputs(true);

		initData();
		setCycles((prevCycles) => prevCycles - 1);

		setStatus("STUDY");

		//setInterval(() => {updateTimer(); }, 1000);
		updateTimer();
	}

	function stopTimer(): void {
		clearInterval(timer);
		setTimer("");
		setMinutes(studyTime);
		setSeconds(0);
		disableInputs(false);
		setStatus("END OF SESSION");
		resetPomodoroColor();
	}

	function updateTimer(): void {
		setSeconds((prevSeconds) => prevSeconds - 1);
		if (seconds < 0){
			setSeconds(59);
			setMinutes((prevSMinutes) => prevSMinutes - 1);
		}

		if (minutes < 0){
			if (cycles === 0){
				stopTimer();
				return;
			}

			if (isStudySession){
				setStatus("PAUSE")
				setIsStudySession(false);
				//suona campanello

				//animazione al contrario
				startAnimation();
				setMinutes(pauseTime);
				setSeconds(0);
			}
			else {
				setIsStudySession(true);
				//suona campanello
				
				//animazione standard
				startAnimation();
				setStatus("STUDY")

				setMinutes(studyTime);
				setSeconds(0);
				setCycles((prevCycles) => prevCycles - 1);
			}
		}
		setTimer(pad(minutes) + ":" + pad(seconds));
	}

	function startAnimation(): void {
		if (pomodoroRef.current){
			pomodoroRef.current.classList.remove("animate-pomodoro");
			pomodoroRef.current.classList.remove("reverse-animate-pomodoro");
			if (isStudySession){
				pomodoroRef.current.style.animationDuration = `${studyTime * 60}s`;
				pomodoroRef.current.classList.add("animate-pomodoro");
			}

			if (!isStudySession){
				pomodoroRef.current.style.animationDuration = `${studyTime * 60}s`;
				pomodoroRef.current.classList.add("reverse-animate-pomodoro");
			}
		}
	}

	function updateTimerText(): void {
		setTimer(pad(minutes) + ":" + pad(seconds));
	}

	function disableInputs(value: boolean): void {
		setIsStopDisabled(!value);
		setIsStartDisabled(value);

		setIsPauseboxDisabled(value);
		setIsStudyboxDisabled(value);
		setIsCyclesboxDisabled(value);
	}

	function pad(value: number): string {
		return value < 10 ? "0" + value : String(value);
	}

	function resetPomodoroColor(): void {
		if (pomodoroRef.current){
			pomodoroRef.current.style.animationDuration = `0.1s`;
			pomodoroRef.current.classList.add("animate-pomodoro");

			setTimeout(() => {
				if (pomodoroRef.current){
				pomodoroRef.current.classList.remove('animate-pomodoro');
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
        			<img src="/images/tomato.png" alt="tomato.png"/>
        			<div id="timer" className="timer">{timer}</div>
    			</div>

				<div>
					<h4 style={{margin: "0.5em auto 1em" , width: "300px" , color: "white" , textAlign: "center"}}>{status}</h4>

					<div>
					<button id="start-button" 
							type="button" 
							className="btn btn-success" 
							onClick={startProcess}
							disabled={isStartDisabled}>START</button>
					<button id="stop-button" 
							type="button" 
							className="btn btn-danger" 
							onClick={stopProcess}
							disabled={isStopDisabled}>STOP</button>
					</div>

					<p className="paragraph">{paragraph}</p>
				</div>

				<div className="pannello studyTime" >
					<label htmlFor="inputStudy">Study time in minutes</label>
					<input 	name="inputStudy" 
							type="number" 
							placeholder="Enter the time" 
							className="inputStudyTime" 
							id="inputStudy"
							value={studyTime}
							onChange={(e: ChangeEvent<HTMLInputElement>): void =>
								setStudyTime(parseInt(e.target.value))}
							disabled={isStudyboxDisabled} />
				</div>

				<div className="pannello breakTime">
					<label htmlFor="inputPause"> Break time in minutes </label>
					<input 
							name="inputPause" 
							type="number" 
							placeholder="Enter the time" 
							id="inputPause"
							value={pauseTime}
							onChange={(e: ChangeEvent<HTMLInputElement>): void =>
								setPauseTime(parseInt(e.target.value))}
							disabled={isPauseboxDisabled} />
				</div>

				<div className="pannello studyCycles">
					<label htmlFor="inputCycles"> Number of study cycles </label>
					<input 
							name="inputCycles" 
							type="number" 
							placeholder="Enter the study cycles" 
							id="inputCycles" 
							value={cycles}
							onChange={(e: ChangeEvent<HTMLInputElement>): void =>
								setCycles(parseInt(e.target.value))}
							disabled={isCyclesboxDisabled} />
				</div>
			</div>
		</>
	);
}