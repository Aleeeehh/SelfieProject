import React from "react";

function Home(): React.JSX.Element {
	const [message, setMessage] = React.useState("");

	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch("http://localhost:3002");
				if (res.status === 200) {
					const resBody = await res.json();

					setMessage(resBody.message);
				} else {
					setMessage("Errore del server");
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
				<div className="preview preview-calendar">Qui ci va la preview del calendario</div>
				<div className="preview preview-pomodoro">Qui ci va la preview del pomodoro</div>
				<div className="preview preview-note">Qui ci va la preview delle note</div>
				<div className="preview preview-projects">Qui ci va la preview dei progetti</div>
			</div>
		</>
	);
}

export default Home;
