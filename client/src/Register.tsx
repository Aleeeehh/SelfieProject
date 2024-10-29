import React from "react";
import { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { ResponseBody } from "./types/ResponseBody";
import { SERVER_API } from "./params/params";
import { ResponseStatus } from "./types/ResponseStatus";

type RegisterData = {
	username: string;
	password: string;
	confirmPassword: string;
	firstName: string;
	lastName: string;
	birthday: Date;
	address: string;
};

const initialState: RegisterData = {
	username: "",
	password: "",
	confirmPassword: "",
	firstName: "",
	lastName: "",
	birthday: new Date(),
	address: "",
};

export default function Register(): React.JSX.Element {
	const [data, setData] = React.useState(initialState);
	const [message, setMessage] = React.useState("");

	const { isLoggedIn } = useAuth();
	const nav = useNavigate();

	// Redireziona alla home se già loggato
	React.useEffect(() => {
		if (isLoggedIn) {
			nav("/");
		}
	}, [isLoggedIn, nav]);

	// Funzione di registrazione
	async function handleRegister(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// Controlla che le password coincidano
		if (data.password !== data.confirmPassword) {
			setMessage("Le password non coincidono");
			return;
		}

		try {
			// Dati dell'utente
			const registrationData: RegisterData = {
				username: data.username,
				password: data.password,
				confirmPassword: data.confirmPassword,
				firstName: data.firstName,
				lastName: data.lastName,
				birthday: data.birthday,
				address: data.address,
			};

			const res = await fetch(SERVER_API + "/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(registrationData),
			});

			const resBody = (await res.json()) as ResponseBody;

			if (resBody.value === ResponseStatus.GOOD) {
				setMessage(
					"Registrazione completata con successo. Sarai reindirizzato tra 5 secondi alla pagina di login."
				);

				setTimeout(() => {
					nav("/login");
				}, 5000);
			} else {
				setMessage("Registrazione fallita: " + resBody.message);
			}
		} catch (e) {
			setMessage("Errore di connessione al server");
		}
	}

	return (
		<div className="registration-body">
			<div className="registration-background">
				<div className="registration-container">
					<div className="avatar">
						<img src="/images/avatar.png" alt="Avatar" />
					</div>
					<div className="registration-header">
						{message && <div>{message}</div>}
						<h2>Benvenuto in SELFIE!</h2>
						<p>Crea un account per iniziare la tua esperienza</p>
					</div>
					<form className="registration-form">
						<div>
							<label>Nome</label>
							<input
								type="text"
								value={data.firstName}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, firstName: e.target.value })
								}
								required
							/>
						</div>

						<div>
							<label>Cognome</label>
							<input
								type="text"
								value={data.lastName}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, lastName: e.target.value })
								}
								required
							/>
						</div>

						<div>
							<label>Indirizzo</label>
							<input
								type="text"
								value={data.address}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, address: e.target.value })
								}
								required
							/>
						</div>

						<div>
							<label>Data di nascita</label>
							<input
								type="date"
								value={data.birthday.toISOString().split("T")[0]}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, birthday: new Date(e.target.value) })
								}
								required
							/>
						</div>

						<div>
							<label>Username</label>
							<input
								type="text"
								value={data.username}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, username: e.target.value })
								}
								required
							/>
						</div>

						<div>
							<label>Password</label>
							<input
								type="password"
								value={data.password}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, password: e.target.value })
								}
								required
							/>
						</div>

						<div>
							<label>Conferma Password</label>
							<input
								type="password"
								value={data.confirmPassword}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, confirmPassword: e.target.value })
								}
								required
							/>
						</div>

						<button onClick={handleRegister}>Registrati</button>
					</form>
					<p className="login-message">
						Hai già un account? <a href="/login">Accedi qui</a>
					</p>
				</div>
			</div>
		</div>
	);
}
