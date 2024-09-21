import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Pomodoro(): React.JSX.Element {
	const [message, setMessage] = React.useState("");
	const [studyMinutes, setStudyMinutes] = React.useState("");
	const [pauseMinutes, setPauseMinutes] = React.useState("");
	const [cycles, setCycles] = React.useState("");


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

	function handleStartButton(e: React.MouseEvent<HTMLButtonElement>): void{
		e.preventDefault();

		//TODO: complete the function
	}

	function handleStopButton(e: React.MouseEvent<HTMLButtonElement>): void{
		e.preventDefault();

		//TODO: complete the function
	}

	return (
		<>
			{message && <div>{message}</div>}
			<div className="container-fluid">
				<header>
					<h1>POMODORO TIMER</h1>
				</header>
				<img src="images/tomato.png" alt="tomato.png" />

				<div>
					<h4 id="status"></h4>
					<button id="start-button" type="button" className="btn btn-success" onClick={handleStartButton}>START</button>
					<button id="stop-button" type="button" className="btn btn-danger" onClick={handleStopButton} disabled>STOP</button>
					<p className="paragraph">FILL THE SPACES AND PRESS START TO BEGIN!</p>
				</div>

				<div className="pannello studyTime">
				<label htmlFor="inputStudy">Study time in minutes</label>
				<input name="inputStudy" 
					   type="number" 
					   placeholder="Enter the time" 
					   className="inputStudyTime" 
					   value={studyMinutes}
					   onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
						setStudyMinutes(e.target.value)
					} />
				</div>

				<div className="pannello breakTime">
					<label htmlFor="inputPause"> Break time in minutes </label>
					<input name="inputPause" 
						   type="number" 
						   placeholder="Enter the time" 
						   value={pauseMinutes}
						   onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
							setPauseMinutes(e.target.value)
						} />
				</div>

				<div className="pannello studyCycles">
					<label htmlFor="inputCycles"> Number of study cycles </label>
					<input name="inputCycles" 
					type="number" 
					placeholder="Enter the study cycles" 
					value={cycles}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
						setCycles(e.target.value)
					} />
				</div>
			</div>
		</>
	);
}
