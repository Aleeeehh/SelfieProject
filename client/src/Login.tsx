import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";


export default function Login(): React.JSX.Element {
	const [username, setUsername] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [clearPswd, setClearPswd] = React.useState(false);
	const [message, setMessage] = React.useState("");
	const [errorMessage, setErrorMessage] = React.useState("");

	const nav = useNavigate();
	const { login, isLoggedIn } = useAuth();

	React.useEffect(() => {
		if (isLoggedIn) {
			nav("/");
		}
	}, [isLoggedIn, nav]);

	async function handleLogin(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();
		try {
			const success = await login(username, password);
			if (success) {
				setMessage("Utente authenticato");
				nav("/");
			} else {
				setErrorMessage("Credenziali errate");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	return (
		<div className="body">
			{message && <div>{message}</div>}
			<div className="background">
				<div className="login-container">
					<div className="avatar">
						<img src="/images/avatar.png" alt="Avatar" />
					</div>
					<form>
						<label htmlFor="username">
							Username: 
							<input
								type="text"
								name="username"
								value={username}
								onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
									setUsername(e.target.value);
								}}
							/>
						</label>

						<label htmlFor="password">
							Password: 
							<input
								type={clearPswd ? "text" : "password"}
								name="password"
								value={password}
								onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
									setPassword(e.target.value)
								}
							/>
							Nascondi: 
							<i
								className={`bi ${clearPswd ? "bi-eye" : "bi-eye-slash"}`}
								onClick={(): void => setClearPswd(!clearPswd)}
								style={{ cursor: "pointer", marginLeft: "8px" }}
							></i>
						</label>

						<button onClick={handleLogin}>Login</button>
						<p className="error-message">{errorMessage}</p>
						<p className="register-link">Not yet registered? <a href="/register">Click here!</a></p>
						
					</form>
				</div>
			</div>
		</div>
	);
}
