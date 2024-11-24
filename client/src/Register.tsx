import React from "react";
import { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
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
	birthday: new Date(Date.now()),
	address: "",
};

export default function Register(): React.JSX.Element {
	const [data, setData] = React.useState(initialState);
	const [message, setMessage] = React.useState("");

	const isLoggedIn = !!localStorage.getItem("loggedUserId");
	const nav = useNavigate();

	// Redireziona alla home se già loggato
	React.useEffect(() => {
		if (isLoggedIn) {
			nav("/");
		}
	}, [isLoggedIn, nav]);

	async function handleChange(
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	): Promise<void> {
		try {
			if (e.target.name === "birthday") {
				console.log(e.target.value);
				setData({ ...data, [e.target.name]: new Date(e.target.value) });
			} else {
				setData({ ...data, [e.target.name]: e.target.value });
			}
		} catch (e) {
			if (e instanceof Error) {
				console.log(e.message);
			} else {
				console.log(e);
			}
		}
	}

	// Funzione di registrazione
	async function handleRegister(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// Controlla che le password coincidano
		if (data.password !== data.confirmPassword) {
			setMessage("Le password non coincidono");
			return;
		}

		console.log("Registering user:", data);

		fetch(`${SERVER_API}/users/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: data.username,
				password: data.password,
				confirmPassword: data.confirmPassword,
				firstName: data.firstName,
				lastName: data.lastName,
				birthday: new Date(data.birthday).toISOString().split("T")[0],
				address: data.address,
			}),
		})
			.then((response) => response.json())
			.then((resBody) => {
				console.log(resBody);
				if (resBody.status === ResponseStatus.GOOD) {
					alert(
						"Registrazione completata con successo. Sarai reindirizzato alla pagina di login."
					);

					nav("/login");
				} else {
					setMessage("Registrazione fallita: " + resBody.message);
				}
			})
			.catch((error) => {
				console.error(error);
				setMessage("Registrazione fallita: " + error);
			});
	}

	return (
		<div className="registration-body">
			<div className="registration-background">
				<div className="registration-container">
					<div className="registration-avatar">
						<img src="/images/avatar.png" alt="Avatar" />
					</div>
					<div className="registration-header">
						<h2>Benvenuto in SELFIE!</h2>
						<p>Crea un account per iniziare la tua esperienza</p>
					</div>
					<form className="registration-form">
						<div>
							<label>Nome</label>
							<input
								type="text"
								name="firstName"
								value={data.firstName}
								onChange={handleChange}
								required
							/>
						</div>

						<div>
							<label>Cognome</label>
							<input
								type="text"
								name="lastName"
								value={data.lastName}
								onChange={handleChange}
								required
							/>
						</div>

						<div>
							<label>Indirizzo</label>
							<input
								type="text"
								name="address"
								value={data.address}
								onChange={handleChange}
								required
							/>
						</div>

						<div>
							<label>Data di nascita</label>
							<div>
								<input
									type="date"
									className="btn border"
									name="birthday"
									value={
										data.birthday.toISOString().split("T")[0] ||
										new Date(Date.now()).toISOString().split("T")[0]
									}
									onChange={handleChange}
									required
								/>
							</div>
						</div>

						<div>
							<label>Username</label>
							<input
								type="text"
								name="username"
								value={data.username}
								onChange={handleChange}
								required
							/>
						</div>

						<div>
							<label>Password</label>
							<input
								type="password"
								name="password"
								value={data.password}
								onChange={handleChange}
								required
							/>
						</div>

						<div>
							<label>Conferma Password</label>
							<input
								type="password"
								name="confirmPassword"
								value={data.confirmPassword}
								onChange={handleChange}
								required
							/>
						</div>
						{message && <div>{message}</div>}

						<button onClick={handleRegister}>Registrati</button>
					</form>
					<p className="registration-message">
						Hai già un account? <a href="/login">Accedi qui</a>
					</p>
				</div>
			</div>
		</div>
	);
}
