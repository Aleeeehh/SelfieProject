import React from "react";

export default function Note(): React.JSX.Element {
	const [message, setMessage] = React.useState("");

	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch("http://localhost:3002/api/note");
				console.log(res);
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	return <>{message && <div>{message}</div>}</>;
}
