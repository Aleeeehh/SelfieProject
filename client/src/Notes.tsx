import React from "react";
import { SERVER_API } from "./params/params";

export default function Notes(): React.JSX.Element {
	const [message, setMessage] = React.useState("");

	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/notes`);
				console.log(res);
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	return <>{message && <div>{message}</div>}</>;
}
