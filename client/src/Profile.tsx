import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import { useNavigate } from "react-router-dom";
import User from "./types/User";
import { ResponseStatus } from "./types/ResponseStatus";
import { useAuth } from "./AuthContext";

const emptyUser: User = {
	id: "",
	username: "",
	password: "",
	firstName: "",
	lastName: "",
	birthday: new Date(),
};

export default function Profile(): React.JSX.Element {
	const [message, setMessage] = React.useState("");
	const [user, setUser] = React.useState(emptyUser);

	const nav = useNavigate();
	const { logout, isLoggedIn } = useAuth();

	React.useEffect(() => {
		fetchUserData();
	}, [isLoggedIn, nav]);

	async function fetchUserData(): Promise<void> {
		try {
			const res = await fetch(`${SERVER_API}/users`);
			if (res.status === 200) {
				const data = (await res.json()) as ResponseBody;
				setUser(data.value);
			} else {
				setMessage("Errore nel caricamento dei dati utente");
				nav("/login");
			}
		} catch (e) {
			console.log(e);
			setMessage("Impossibile raggiungere il server");
		}
	}

	async function handleLogout(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();
		try {
			await logout();
			nav("/login");
		} catch (e) {
			setMessage("Errore durante il tentativo di logout");
		}
	}

	async function handleDelete(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// TODO: validate inputs (not empty, max length)
		try {
			const res = await fetch(`${SERVER_API}/users`, {
				method: "DELETE",
			});

			const resBody = (await res.json()) as ResponseBody;
			console.log(resBody);

			if (resBody.status === ResponseStatus.GOOD) {
				alert("Utente eliminato correttamente!");
				nav("/login");
			} else {
				setMessage("Errore durante il tentativo di cancellazione");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	return (
		<>
			{message && <div>{message}</div>}
			<div className="profile-container">
				<div>{user.username}</div>
				<div>{user.password}</div>
				<button style={{ backgroundColor: "#ffff00" }} onClick={handleLogout}>
					Logout
				</button>
				<button style={{ backgroundColor: "#ffff00" }} onClick={handleDelete}>
					Cancella Account
				</button>
			</div>
		</>
	);
}
