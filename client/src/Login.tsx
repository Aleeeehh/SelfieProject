import React from "react";
import { useNavigate } from "react-router-dom";
import { ResponseStatus } from "./types/ResponseStatus";
import { ResponseBody } from "./types/ResponseBody";
import { SERVER_API } from "./params/params";

export default function Login(): React.JSX.Element {
	const [username, setUsername] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [clearPswd, setClearPswd] = React.useState(false);
	const [message, setMessage] = React.useState("");

	const nav = useNavigate();

	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/users/`);
				if (res.status === 200) {
					const resBody = await res.json();
					if (resBody.value) nav("/");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	async function handleLogin(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();
		try {
			const res = await fetch(`${SERVER_API}/users/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
			});

			const resBody: ResponseBody = await res.json();
			if (resBody.status === ResponseStatus.GOOD) {
				setMessage("Utente authenticato");
				nav("/");
			} else {
				const msg = resBody.message || "Unable lo login";
				setMessage(msg);
			}
		} catch (e) {
			setMessage("Credenziali errate");
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
