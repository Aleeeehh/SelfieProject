import React from "react";
import { SERVER_API } from "./params/params";

export default function Projects(): React.JSX.Element {
	const [message, setMessage] = React.useState("");

	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`"${SERVER_API}/projects`);
				console.log(res);
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	return <>{message && <div>{message}</div>}</>;
}
