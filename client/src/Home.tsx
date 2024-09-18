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
		<div className="home-table">
			{/* <a href="/info">
				<button>Cliccami</button>
			</a> */}
			{message && <div>{message}</div>}
		</div>
	);
}

export default Home;
