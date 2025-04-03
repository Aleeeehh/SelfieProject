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
	const [confirmDelete, setConfirmDelete] = React.useState(false);

	const [oldPassword, setOldPassword] = React.useState("");
	const [newPassword, setNewPassword] = React.useState("");
	const [confirmNewPassword, setConfirmNewPassword] = React.useState("");

	const nav = useNavigate();
	const isLoggedIn = localStorage.getItem("loggedUserId") !== null;

	React.useEffect(() => {
		fetchUserData();
	}, [isLoggedIn, nav, isEditing]);

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
			window.location.reload();
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
				//alert("Utente eliminato correttamente!");
				nav("/login");
			} else {
				setMessage("Errore durante il tentativo di cancellazione");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	async function handleUpdate(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		if (user.firstName === "" || user.lastName === "" || user.address === "") {
			setMessage("Compilare tutti i campi ");
			return;
		}

		if (changePassword && (oldPassword === "" || newPassword === "" || confirmNewPassword === "")) {
			setMessage("Compilare tutti i campi ");
			return;
		}


		if (changePassword) {
			if (newPassword !== confirmNewPassword) {
				setMessage("Le password non coincidono");
				return;
			}
		}

		if (new Date(user.birthday) > new Date(Date.now())) {
			setMessage("La data di nascita non può essere nel futuro");
			//setUser();
			return;
		}

		/*if (oldPassword !== user.password) {
			console.log(oldPassword, user.password);
			console.log(oldPassword, user.password);
			console.log(oldPassword, user.password);
			console.log(oldPassword, user.password);
			console.log(oldPassword, user.password);
			setMessage("Vecchia password errata");
			return;
		}*/


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
				//alert("Utente aggiornato correttamente!");
				fetchUserData();
				setIsEditing(false);
				setMessage("");
				setChangePassword(false);
				setOldPassword("");
				setNewPassword("");
				setConfirmNewPassword("");
			} else if (resBody.message === "Old password is incorrect") {
				setMessage("Vecchia password errata");
			} else {
				//setMessage("Errore durante il tentativo di aggiornamento");
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
							`/images/profile/${user.profileImage}`
						}
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
									}
								>
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
							<label className="eighty-percent">Indirizzo di casa:
								<p>{user.address}</p>
							</label>
						</>
					) : (
						<>
							<label className="eighty-percent" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
								Data di nascita:
								<input
									type="date"
									className="btn profile-date-input"
									name="birthday"
									value={new Date(user.birthday).toISOString().split("T")[0]}
									onChange={(e): void => {
										const selectedDate = new Date(e.target.value);
										const today = new Date();
										today.setHours(0, 0, 0, 0);

										if (selectedDate > today) {
											setMessage("La data di nascita non può essere nel futuro");
											return;
										}

										setMessage("");
										setUser({
											...user,
											birthday: selectedDate,
										});
									}}
									max={new Date().toISOString().split("T")[0]}
									required
								/>
							</label>
							<label className="eighty-percent">
								Indirizzo di casa:
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
						<label
							htmlFor="updatePassword"
							style={{
								cursor: 'pointer',
								userSelect: 'none',  // Impedisce la selezione del testo
								WebkitUserSelect: 'none',  // Per Safari
								MozUserSelect: 'none',     // Per Firefox
								msUserSelect: 'none'       // Per IE/Edge
							}}
						>
							Voglio aggiornare la password
							<input
								type="checkbox"
								name="updatePassword"
								id="updatePassword"
								onChange={(e): void => setChangePassword(e.target.checked)}
								style={{ cursor: "pointer" }}
							/>
						</label>
						{changePassword && (
							<>
								<label className="eighty-percent">
									Vecchia password:
									<input
										type="password"
										name="oldPassword"
										className="password-as-text"
										onChange={(e): void => setOldPassword(e.target.value)}
									/>
								</label>
								<label className="eighty-percent">
									Nuova password:
									<input
										type="password"
										name="newPassword"
										className="password-as-text"
										onChange={(e): void => setNewPassword(e.target.value)}
									/>
								</label>
								<label className="eighty-percent">
									Conferma Nuova password:
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
				{message && isEditing && <div className="error-message">{message}</div>}
				<div className="buttons">
					{!isEditing ? (
						<>
							<button
								type="button"
								className="btn btn-warning custom-btn"
								onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
									e.preventDefault();
									setIsEditing(true);
								}}
							>
								MODIFICA PROFILO
							</button>

							<button
								type="button"
								className="btn btn-warning custom-btn"
								onClick={handleLogout}
							>
								EFFETTUA LOGOUT
							</button>

							<button
								type="button"
								className="btn btn-danger custom-btn"
								onClick={(): void => setConfirmDelete(true)}
							>
								ELIMINA ACCOUNT
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								className="btn btn-warning custom-btn"
								onClick={handleUpdate}
							>
								AGGIORNA PROFILO
							</button>
							<button
								type="button"
								className="btn btn-danger custom-btn"
								onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
									e.preventDefault();
									setIsEditing(false);
									setChangePassword(false);
									setOldPassword("");
									setNewPassword("");
									setConfirmNewPassword("");
									setMessage("");
								}}
							>
								ANNULLA
							</button>
						</>
					)}
				</div>
			</div>
			<div
				className="confirmDelete-background"
				style={{ display: confirmDelete ? "flex" : "none" }}
			>
				<div className="confirmDelete-container">
					<h2>Stai per eliminare il tuo account. Vuoi procedere?</h2>
					<div style={{ display: "flex", gap: "2em" }}>
						<button
							style={{ backgroundColor: "#ff6b6b" }}
							onClick={(): void => setConfirmDelete(false)}
						>
							Annulla
						</button>
						<button
							onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
								setConfirmDelete(false);
								handleDelete(e);
							}}
						>
							Continua
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
