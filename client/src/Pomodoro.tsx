import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Pomodoro(): React.JSX.Element {
	const [message, setMessage] = React.useState("caricamento in corso");

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


	return (
		<>			
			{message && <div>{message}</div>}
			<div className="pomodoro-container">
				<header>
					<h1 id="title">POMODORO TIMER</h1>
				</header>
				<img src="../images/tomato.png" alt="tomato.png" />

				<div>
					<h4 id="status"></h4>

					<div>
					<button id="start-button" type="button" className="btn btn-success">START</button>
					<button id="stop-button" type="button" className="btn btn-danger" disabled>STOP</button>
					</div>

					<p className="paragraph">FILL THE SPACES AND PRESS START TO BEGIN!</p>
				</div>

				<div className="pannello studyTime" >
				<label htmlFor="inputStudy">Study time in minutes</label>
				<input name="inputStudy" type="number" placeholder="Enter the time" className="inputStudyTime" id="inputStudy" />
				</div>

				<div className="pannello breakTime">
					<label htmlFor="inputPause"> Break time in minutes </label>
					<input name="inputPause" type="number" placeholder="Enter the time" id="inputPause" />
				</div>

				<div className="pannello studyCycles">
					<label htmlFor="inputCycles"> Number of study cycles </label>
					<input name="inputCycles" type="number" placeholder="Enter the study cycles" id="inputCycles" />
				</div>
			</div>
		</>
	);
}