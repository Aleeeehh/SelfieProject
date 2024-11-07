import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import { useNavigate } from "react-router-dom";
import User from "./types/User";
import { ResponseStatus } from "./types/ResponseStatus";
import { useAuth } from "./AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";


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
		<div className="profile-body">
			{message && <div>{message}</div>}
			<div className="profile-container">
				<div className="profile-avatar">
					<img src="/images/avatar.png" alt="Avatar" />
				</div>
				<div className="profile-header">
					<h1>{`${user.firstName} ${user.lastName}`}</h1>
					<p className="profile-username">@{user.username}</p>
				</div>
				
				<div className="profile-details">
					<div>
					<label>Data di nascita:</label>
					<p>{new Date(user.birthday).toLocaleDateString()}</p>
					</div>
					<div>
					<label>Indirizzo:</label>
					<p>{user.address}</p>
					</div>
				</div>

				<div className="buttons">
					<button
						type="button"
						className="btn btn-warning custom-btn"
						onClick={handleLogout}>
						EFFETTUA LOGOUT
					</button>
					
					<button
						type="button"
						className="btn btn-danger custom-btn"
						onClick={handleDelete}>
						ELIMINA ACCOUNT
					</button>
				</div>
			</div>
		</div>
	);
}