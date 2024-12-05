import React from "react";
import { profileImages, SERVER_API } from "./lib/params";
import { ResponseBody } from "./types/ResponseBody";
import { useNavigate } from "react-router-dom";
import User from "./types/User";
import { ResponseStatus } from "./types/ResponseStatus";
import "bootstrap/dist/css/bootstrap.min.css";
import { logout } from "./AuthContext";

const emptyUser: User = {
	profileImage: "",
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
	const [isEditing, setIsEditing] = React.useState(false);
	const [changePassword, setChangePassword] = React.useState(false);

	const [oldPassword, setOldPassword] = React.useState("");
	const [newPassword, setNewPassword] = React.useState("");
	const [confirmNewPassword, setConfirmNewPassword] = React.useState("");

	const nav = useNavigate();
	const isLoggedIn = localStorage.getItem("loggedUserId") !== null;

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
				console.log("Errore nel caricamento dei dati utente");
				nav("/login");
			}
		} catch (e) {
			console.log(e);
			console.log("Impossibile raggiungere il server");
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

	async function handleUpdate(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		const newData = {
			firstName: user.firstName,
			lastName: user.lastName,
			profileImage: user.profileImage,
			address: user.address,
			birthday: new Date(user.birthday).toISOString().split("T")[0],
			password: changePassword ? newPassword : undefined,
			oldPassword: changePassword ? oldPassword : undefined,
			confirmPassword: changePassword ? confirmNewPassword : undefined,
		};

		try {
			const res = await fetch(`${SERVER_API}/users`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newData),
			});

			const resBody = (await res.json()) as ResponseBody;
			console.log(resBody);

			if (resBody.status === ResponseStatus.GOOD) {
				alert("Utente aggiornato correttamente!");
				fetchUserData();
				setIsEditing(false);
			} else {
				setMessage("Errore durante il tentativo di aggiornamento");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	return (
		<div className="profile-body">
			<div className="profile-container">
				<div className="profile-avatar">
					<img
						src={
							user.profileImage
								? `/images/profile/${user.profileImage}`
								: "/images/avatar.png"
						}
						alt="Avatar"
					/>
				</div>
				<div className="profile-header">
					{!isEditing ? (
						<>
							<h1>{`${user.firstName} ${user.lastName}`}</h1>
							<p className="profile-username">@{user.username}</p>
						</>
					) : (
						<>
							<label className="eighty-percent">Cambia Immagine di profilo:
								<select
									name="profileImage"
									value={user.profileImage}
									style={{ outline: "0" }}
									onChange={(e): void =>
										setUser({ ...user, profileImage: e.target.value })
									}>
									{profileImages.map((image) => (
										<option key={image.url} value={image.url}>
											{image.name}
										</option>
									))}
								</select>
							</label>

							<label className="eighty-percent">Nome:
								<input
									type="text"
									name="firstName"
									value={user.firstName}
									onChange={(e): void =>
										setUser({ ...user, firstName: e.target.value })
									}
									required
								/>
							</label>

							<label className="eighty-percent">Cognome:
								<input
									type="text"
									name="lastName"
									value={user.lastName}
									onChange={(e): void =>
										setUser({ ...user, lastName: e.target.value })
									}
									required
								/>
							</label>
						</>
					)}
				</div>

				<div className="profile-details">
					{!isEditing ? (
						<>
							<label className="eighty-percent">Data di nascita:
								<p>{new Date(user.birthday).toLocaleDateString()}</p>
							</label>
							<label className="eighty-percent">Indirizzo:
								<p>{user.address}</p>
							</label>
						</>
					) : (
						<>
							<label className="eighty-percent" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>Data di nascita:
								<input
									type="date"
									className="btn profile-date-input"
									name="birthday"
									value={new Date(user.birthday).toISOString().split("T")[0]}
									onChange={(e): void =>
										setUser({
											...user,
											birthday: new Date(e.target.value),
										})
									}
									required
								/>
							</label>
							<label className="eighty-percent">Indirizzo:
								<input
									type="text"
									name="address"
									value={user.address}
									onChange={(e): void =>
										setUser({ ...user, address: e.target.value })
									}
									required
								/>
							</label>
						</>
					)}
				</div>

				{isEditing && (
					<div className="profile-details">
						<label>
							Aggiorna password?
							<input
								type="checkbox"
								name="updatePassword"
								onChange={(e): void => setChangePassword(e.target.checked)}
							/>
						</label>
						{changePassword && (
							<>
								<label className="eighty-percent">Vecchia password:
									<input
										type="password"
										name="oldPassword"
										className="password-as-text"
										onChange={(e): void => setOldPassword(e.target.value)}
									/>
								</label>
								<label className="eighty-percent">Nuova password:
									<input
										type="password"
										name="newPassword"
										className="password-as-text"
										onChange={(e): void => setNewPassword(e.target.value)}
									/>
								</label>
								<label className="eighty-percent">Conferma Nuova password:
									<input
										type="password"
										name="confirmNewPassword"
										className="password-as-text"
										onChange={(e): void => setConfirmNewPassword(e.target.value)}
									/>
								</label>
							</>
						)}
					</div>
				)}

				<div className="buttons">
					{!isEditing ? (
						<>
							<button
								type="button"
								className="btn btn-warning custom-btn"
								onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
									e.preventDefault();
									setIsEditing(true);
								}}>
								MODIFICA PROFILO
							</button>

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
						</>
					) : (
						<>
							{message && <div className="error-message">{message}</div>}
							<button
								type="button"
								className="btn btn-warning custom-btn"
								onClick={handleUpdate}>
								AGGIORNA PROFILO
							</button>
							<button
								type="button"
								className="btn btn-danger custom-btn"
								onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
									e.preventDefault();
									setIsEditing(false);
								}}>
								ANNULLA
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
