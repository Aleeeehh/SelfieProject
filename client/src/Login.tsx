import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Login(): React.JSX.Element {
	const [username, setUsername] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [clearPswd, setClearPswd] = React.useState(false);
	const [message, setMessage] = React.useState("");

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
				setMessage("Credenziali errate");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	return (
		<div className="login-form">
			<form>
				<label htmlFor="username">
					Username
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
					Password
					<input
						type={clearPswd ? "text" : "password"}
						name="password"
						value={password}
						onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
							setPassword(e.target.value)
						}
					/>
				</label>
				<input
					type="checkbox"
					checked={clearPswd}
					onClick={(): void => setClearPswd(!clearPswd)}
				/>
				<button onClick={handleLogin}>Login</button>
			</form>

			{message && <div>{message}</div>}
		</div>
	);
}
