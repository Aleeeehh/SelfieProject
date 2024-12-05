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
			{message && <div>{message}</div>}
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
				{isEditing && (
					<div>
						<label>Cambia Immagine di profilo</label>
						<select
							name="profileImage"
							value={user.profileImage}
							onChange={(e): void =>
								setUser({ ...user, profileImage: e.target.value })
							}>
							{profileImages.map((image) => (
								<option key={image.url} value={image.url}>
									{image.name}
								</option>
							))}
						</select>
					</div>
				)}
				<div className="profile-header">
					{!isEditing ? (
						<h1>{`${user.firstName} ${user.lastName}`}</h1>
					) : (
						<div>
							<div>
								<label>Nome</label>
								<input
									type="text"
									name="firstName"
									value={user.firstName}
									onChange={(e): void =>
										setUser({ ...user, firstName: e.target.value })
									}
									required
								/>
							</div>

							<div>
								<label>Cognome</label>
								<input
									type="text"
									name="lastName"
									value={user.lastName}
									onChange={(e): void =>
										setUser({ ...user, lastName: e.target.value })
									}
									required
								/>
							</div>
						</div>
					)}
					<p className="profile-username">@{user.username}</p>
				</div>

				<div className="profile-details">
					<div>
						<label>Data di nascita:</label>
						{!isEditing ? (
							<p>{new Date(user.birthday).toLocaleDateString()}</p>
						) : (
							<div>
								<input
									type="date"
									className="btn border"
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
							</div>
						)}
					</div>
					<div>
						<label>Indirizzo:</label>
						{!isEditing ? (
							<p>{user.address}</p>
						) : (
							<div>
								<label>Indirizzo</label>
								<input
									type="text"
									name="address"
									value={user.address}
									onChange={(e): void =>
										setUser({ ...user, address: e.target.value })
									}
									required
								/>
							</div>
						)}
					</div>
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
							<div>
								<label>Vecchia password</label>
								<input
									type="password"
									name="oldPassword"
									onChange={(e): void => setOldPassword(e.target.value)}
								/>
								<label>Nuova password</label>
								<input
									type="password"
									name="newPassword"
									onChange={(e): void => setNewPassword(e.target.value)}
								/>
								<label>Conferma Nuova password</label>
								<input
									type="password"
									name="confirmNewPassword"
									onChange={(e): void => setConfirmNewPassword(e.target.value)}
								/>
							</div>
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
							<button
								type="button"
								className="btn btn-warning custom-btn"
								onClick={handleUpdate}>
								AGGIORNA PROFILO
							</button>
							<button
								type="button"
								className="btn btn-warning custom-btn"
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
