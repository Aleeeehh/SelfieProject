import React from "react";
import { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
//import { useAuth } from "./AuthContext";


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

	const nav = useNavigate();
	/*const { register, isLoggedIn } = useAuth();

	// Redireziona alla home se già loggato
	React.useEffect(() => {
		if (isLoggedIn) {
			nav("/");
		}
	}, [isLoggedIn, nav]);*/

	// Funzione di registrazione
	/*async function handleRegister(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// Controlla che le password coincidano
		if (password !== confirmPassword) {
			setMessage("Le password non coincidono");
			return;
		}

		// Controlla se l'username è già in uso
		const isUsernameTaken = await checkUsername(username);
		if (isUsernameTaken) {
			setMessage("Username già in uso");
			return;
		}

		try {
			// Dati dell'utente
			const userData = {
				username,
				password,
				firstName,
				lastName,
				birthday,
				address,
			};

			const success = await register(userData); // Funzione di registrazione
			if (success) {
				setMessage("Registrazione completata con successo");
				nav("/"); // Redireziona alla home
			} else {
				setMessage("Registrazione fallita, riprova");
			}
		} catch (e) {
			setMessage("Errore di connessione al server");
		}
	}*/
	

	async function checkUsername(username: string): Promise<boolean> {
		console.log("Dati inseriti:", data);
		try {
			const response = await fetch(`/api/check-username?username=${username}`);
			if (!response.ok) {
				throw new Error("Errore nella verifica dell'username");
			}
			const data = await response.json();
			console.log("Risposta del server:", data);
			return data.isTaken; // Assumi che la risposta contenga un campo 'isTaken'
		} catch (error) {
			console.error("Errore durante la verifica dell'username:", error);
			setMessage("Errore di connessione al server"); // Da togliere
			return false; // Ritorna false in caso di errore, o gestisci diversamente
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
									setData({ ...data, firstName: e.target.value })}
								required
							/>
						</div>

						<div>
							<label>Cognome</label>
							<input
								type="text"
								value={data.lastName}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, lastName: e.target.value })}
								required
							/>
						</div>

						<div>
							<label>Indirizzo</label>
							<input
								type="text"
								value={data.address}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, address: e.target.value })}
								required
							/>
						</div>

						<div>
							<label>Data di nascita</label>
							<input
								type="date"
								value={data.birthday.toISOString().split('T')[0]}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, birthday: new Date(e.target.value) })}
								required
							/>
						</div>

						<div>
							<label>Username</label>
							<input
								type="text"
								value={data.username}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, username: e.target.value })}
								required
							/>
						</div>

						<div>
							<label>Password</label>
							<input
								type="password"
								value={data.password}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, password: e.target.value })}
								required
							/>
						</div>

						<div>
							<label>Conferma Password</label>
							<input
								type="password"
								value={data.confirmPassword}
								onChange={(e: ChangeEvent<HTMLInputElement>): void =>
									setData({ ...data, confirmPassword: e.target.value })}
								required
							/>
						</div>

						<button onClick={async (): Promise<void> => {
							const isTaken = await checkUsername(data.username);
							if (isTaken) {
								setMessage("Username già in uso");
							} else {
								setMessage("Registrazione completata con successo");
								nav("/login"); // Reindirizza alla pagina di login
							}
						}}>Registrati</button>
					</form>
					<p className="login-message">Hai già un account? <a href="/login">Accedi qui</a></p>
				</div>
			</div>
		</div>
	);
}