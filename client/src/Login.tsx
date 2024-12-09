import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { login } from "./AuthContext";

export default function Login(): React.JSX.Element {
	const [username, setUsername] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [clearPswd, setClearPswd] = React.useState(false);
	const [message, setMessage] = React.useState("");

	const nav = useNavigate();

	const isLoggedIn = localStorage.getItem("loggedUserId") !== null;

	React.useEffect(() => {
		if (isLoggedIn) {
			nav("/");
		}
	}, [nav]);

	async function handleLogin(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();
		try {
			const success = await login(username, password);
			if (success) {
				console.log("Utente authenticato");
				nav("/");
				window.location.reload();
			} else {
				setMessage("Credenziali errate");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	return (
		<div className="login-body">
			<div className="login-background">
				<div className="login-container">
					<div className="login-avatar">
						<img src={`/images/logo.jpeg`} alt="Avatar" />
					</div>
					<div className="login-header">
						<h2>Benvenuto in SELFIE!</h2>
					</div>
					<form className="login-form">

						<div>
							<label>Username</label>
							<input
								type="text"
								name="username"
								value={username}
								onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
									setUsername(e.target.value);
								}}
							/>
						</div>

						<div>
							<label>Password</label>
							<input
								type={clearPswd ? "text" : "password"}
								name="password"
								value={password}
								onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
									setPassword(e.target.value)
								}
							/>
						</div>

						<div
							style={{
								alignItems: "center",
								flexDirection: "row",
							}}
						>
							Nascondi:
							<i
								className={`bi ${clearPswd ? "bi-eye" : "bi-eye-slash"}`}
								onClick={(): void => setClearPswd(!clearPswd)}
								style={{ cursor: "pointer", marginLeft: "8px" }}
							></i>
						</div>

						{message && <div className="error-message">{message}</div>}
						<button onClick={handleLogin}>Login</button>
					</form>
					<p className="login-message">
						Non hai un account? <a href="/register">Clicca qui</a>
					</p>
				</div>
			</div>
		</div>
	);
}
