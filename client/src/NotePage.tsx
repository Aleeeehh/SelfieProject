import React from "react";
import { SERVER_API } from "./lib/params";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Note, { type ListItem } from "./types/Note";
import { useNavigate, useParams } from "react-router-dom";
import { marked } from "marked";
import { Privacy } from "./types/Privacy";
import SearchForm from "./SearchForm";
import User from "./types/User";

const baseNote: Note = {
	id: "",
	title: "",
	text: "",
	owner: "",
	tags: [] as string[],
	privacy: Privacy.PRIVATE,
	accessList: [] as string[],
	toDoList: [] as ListItem[],
};

export default function NotePage(): React.JSX.Element {
	const { id } = useParams();
	const [note, setNote] = React.useState(baseNote as Note);
	const [tag, setTag] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [isEditing, setIsEditing] = React.useState(false);
	const [isPreview, setIsPreview] = React.useState(false);
	const [deletedItems, setDeletedItems] = React.useState([] as string[]); // id list
	const [count, setCount] = React.useState(0);
	const nav = useNavigate();

	const [confirmDelete, setConfirmDelete] = React.useState(false);

	const loggedUser = {
		username: localStorage.getItem("loggedUserName"),
		id: localStorage.getItem("loggedUserId"),
	};

	function refreshNote(): void {
		fetch(`${SERVER_API}/notes/${id}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					setNote(data.value as Note);
					console.log(data.value);
				} else {
					nav("/notes");
				}
			})
			.catch(() => {
				console.log("Impossibile raggiungere il server");
				nav("/notes");
			});

		setCount(0);
		setDeletedItems([]);
	}

	async function getCurrentUser(): Promise<Promise<any> | null> {
		try {
			const res = await fetch(`${SERVER_API}/users`);
			if (!res.ok) {
				console.log("Utente non autenticato");
				return null;
			}
			const data: User = await res.json();
			return data;
		} catch (e) {
			console.log("Impossibile recuperare l'utente corrente");
			return null;
		}
	}

	React.useEffect(() => {
		refreshNote();
	}, []);

	function handleTextChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setNote({ ...note, [e.target.name]: e.target.value });
	}

	function handlePrivacyChange(e: React.ChangeEvent<HTMLSelectElement>): void {
		e.preventDefault();

		setNote({ ...note, privacy: e.target.value as Privacy });
	}

	async function handleUpdateNote(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		if (note.title === "") {
			setMessage("Inserire un titolo valido");
			return;
		}

		if (note.text === "") {
			setMessage("Inserire un testo valido");
			return;
		}

		// TODO: validate inputs (not empty, max length)
		try {
			const res = await fetch(`${SERVER_API}/notes/${id}`, {
				method: "PUT",
				body: JSON.stringify({ ...note, deletedItems }),
				headers: { "Content-Type": "application/json" },
			});

			console.log("NOTA AGGIORNATA:", note);

			const currentUser = await getCurrentUser();
			const owner = currentUser.value._id.toString();
			const todoList = note.toDoList;

			// Per ogni item della nota, controlla se esiste un'attività con lo stesso titolo, se
			// on esiste, crea l'attività (significa che l'item è stato aggiunto con l'aggiornamento della nota)
			for (const item of todoList) {
				console.log(item);
				// Crea l'attività nella lista delle attività

				if (item.endDate) {
					// Se esiste una scadenza per l'item
					// controlla se esiste già un'attività con lo stesso titolo
					const res2 = await fetch(`${SERVER_API}/activities/by-title/${item.text}`);
					const data = await res2.json();
					const activity = data.value;

					//crea l'evento scadenza dell'attività
					//crea l'attività come evento sul calendario
					const res = await fetch(`${SERVER_API}/events`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							idEventoNotificaCondiviso: item.id,
							owner: owner,
							title: "Scadenza " + item.text,
							startTime: new Date(item.endDate.getTime() - 60 * 60 * 1000).toISOString(),
							endTime: item.endDate.toISOString(),
							untilDate: null,
							isInfinite: false,
							frequency: "once",
							location: "",
							repetitions: 1,
						}),
					});
					console.log(res);

					console.log("ATTIVITA TROVATA LEGATA ALL'ITEM:", activity);
					if (!activity) {
						console.log("CREO ATTIVITA' PER L'ITEM APPENA AGGIUNTO");
						const res2 = await fetch(`${SERVER_API}/activities`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								idEventoNotificaCondiviso: note.id,
								title: item.text,
								deadline: item.endDate?.toISOString(),
								accessList: [owner],
								accessListAccepted: [owner],
								description: "Un item contenuto nella ToDoList di una nota",
								owner: owner,
							}),
						});
						console.log(res2);
					}
				}
			}

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				console.log("Nota aggiornata correttamente!");
				refreshNote();
				setIsEditing(false);
			} else {
				setMessage("Errore nell'aggiornamento della nota");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
		setMessage("");
	}
	async function handleDeleteNote(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// TODO: validate inputs (not empty, max length)
		try {
			const res = await fetch(`${SERVER_API}/notes/${id}`, {
				method: "DELETE",
			});

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				console.log("Nota cancellata correttamente!");
				nav("/notes");
			} else {
				setMessage("Errore della cancellazione della nota");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}

		setConfirmDelete(false);
	}

	function addTag(e: React.MouseEvent<HTMLElement>): void {
		e.preventDefault();
		if (!note.tags.includes(tag)) setNote({ ...note, tags: [...note.tags, tag] });
	}

	function deleteTag(e: React.MouseEvent<HTMLElement>, tag: string): void {
		e.preventDefault();
		setNote({ ...note, tags: note.tags.filter((t) => t !== tag) });
	}

	function togglePreview(): void {
		setIsPreview(!isPreview);
	}

	function addUser(e: React.ChangeEvent<HTMLSelectElement>, user: string): void {
		e.preventDefault();

		if (!note.accessList.includes(user))
			setNote({ ...note, accessList: [...note.accessList, user] });
	}

	function RemoveUser(e: React.MouseEvent<HTMLButtonElement>, user: string): void {
		e.preventDefault();
		setNote({ ...note, accessList: note.accessList.filter((u) => u !== user) });
	}

	function handleAddItem(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setNote({
			...note,
			toDoList: [
				...note.toDoList,
				{ text: "Nuova nota", completed: false, id: count.toString() },
			],
		});
		setCount(count + 1);
	}

	function handleRemoveItem(e: React.MouseEvent<HTMLButtonElement>, item: ListItem): void {
		e.preventDefault();

		setNote({
			...note,
			toDoList: note.toDoList.filter((i) => i !== item),
		});

		if (item.id) setDeletedItems((deletedItems) => [...deletedItems, item.id!]);
	}

	function handleUpdateTextItem(e: React.ChangeEvent<HTMLInputElement>, item: ListItem): void {
		e.preventDefault();

		setNote({
			...note,
			toDoList: note.toDoList.map((i) =>
				i.id === item.id ? { ...i, text: e.target.value } : i
			),
		});
	}

	function handleAddDateItem(e: React.MouseEvent<HTMLButtonElement>, item: ListItem): void {
		e.preventDefault();

		setNote({
			...note,
			toDoList: note.toDoList.map((i) =>
				i.id === item.id ? { ...i, endDate: new Date() } : i
			),
		});
	}
	React.useEffect(() => {
		const handleEscKey = (event: KeyboardEvent): void => {
			if (event.key === 'Escape') {
				window.location.href = '/notes';
			}
		};

		window.addEventListener('keydown', handleEscKey);

		return () => {
			window.removeEventListener('keydown', handleEscKey);
		};
	}, []);

	function handleRemoveDateItem(e: React.MouseEvent<HTMLButtonElement>, item: ListItem): void {
		e.preventDefault();

		setNote({
			...note,
			toDoList: note.toDoList.map((i) =>
				i.id === item.id ? { ...i, endDate: undefined } : i
			),
		});
	}

	function handleUpdateDateItem(e: React.ChangeEvent<HTMLInputElement>, item: ListItem): void {
		e.preventDefault();
		console.log(e.target.value);

		setNote({
			...note,
			toDoList: note.toDoList.map((i) =>
				i.id === item.id ? { ...i, endDate: new Date(e.target.value) } : i
			),
		});
	}
	function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>, item: ListItem): void {
		console.log(note.toDoList, item);
		setNote({
			...note,
			toDoList: note.toDoList.map((i) =>
				i.id === item.id ? { ...i, completed: e.target.checked } : i
			),
		});
	}

	function handleAbortChanges(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();

		refreshNote();

		setIsEditing(false);
		setIsPreview(false);
		setMessage("");
	}

	return (
		<>
			<div className="note-background">
				<div className="note-container">
					<div className="note-page-title">
						<div
							style={{
								display: "flex",
								justifyContent: "center",
							}}
						>
							<a href="/notes" className="note-close-link">
								X
							</a>
						</div>
						<p>{isEditing ? "Modifica nota" : note.title}</p>
					</div>

					{/* render title and text */}
					{isEditing ? (
						<>
							<label htmlFor="title">
								Titolo
								<input
									name="title"
									value={note.title}
									onChange={handleTextChange}
								/>
							</label>
							<button style={{ backgroundColor: "bisque", color: "black" }} onClick={togglePreview}>
								{isPreview ? "Modifica" : "Anteprima"}
							</button>
							{isPreview ? (
								<div
									className="markdown-preview"
									dangerouslySetInnerHTML={{
										__html: marked(note.text) as string,
									}}
								/>
							) : (
								<label htmlFor="text">
									Testo della nota
									<textarea
										name="text"
										value={note.text}
										onChange={handleTextChange}
									/>
								</label>
							)}
						</>
					) : (
						<>
							<div
								className="markdown-content"
								dangerouslySetInnerHTML={{
									__html: marked(note.text) as string,
								}}
							/>
						</>
					)}

					{/* render to do list */}
					<label>
						To Do List
						{note.toDoList &&
							note.toDoList.map((l) => (
								<div key={l.id}>
									{isEditing ? (
										<>
											<div className="note-to-do-container-editing">
												<input
													type="text"
													value={l.text}
													style={{ width: "200px", marginBottom: "5px" }}
													placeholder="Nuovo to-do item"
													onChange={(
														e: React.ChangeEvent<HTMLInputElement>
													): void => {
														handleUpdateTextItem(e, l);
													}}
												/>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														flexDirection: "column",
													}}
												>
													{l.endDate ? (
														<>
															<label style={{ margin: "0" }}>
																<input
																	type="date"
																	value={
																		new Date(l.endDate)
																			.toISOString()
																			.split("T")[0]
																	}
																	onChange={(
																		e: React.ChangeEvent<HTMLInputElement>
																	): void =>
																		handleUpdateDateItem(e, l)
																	}
																/>
															</label>
															<button
																onClick={(
																	e: React.MouseEvent<HTMLButtonElement>
																): void =>
																	handleRemoveDateItem(e, l)
																}
															>
																Rimuovi Scadenza
															</button>
														</>
													) : (
														<button
															style={{ backgroundColor: "bisque", color: "black" }}
															onClick={(
																e: React.MouseEvent<HTMLButtonElement>
															): void => handleAddDateItem(e, l)}
														>
															Aggiungi Scadenza
														</button>
													)}
												</div>
												<button
													onClick={(
														e: React.MouseEvent<HTMLButtonElement>
													): void => handleRemoveItem(e, l)}
													style={{ backgroundColor: "#d64545" }}
												>
													Elimina Item
												</button>
											</div>
										</>
									) : (
										<>
											<div className="note-to-do-container">
												<div
													style={{
														display: "flex",
														alignItems: "center",
													}}
												>
													<input
														id="todo-completed"
														type="checkbox"
														style={{ height: "15px", width: "15px" }}
														checked={l.completed}
														disabled={l.completed}
														onChange={async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
															if (!l.completed) {
																handleCheckboxChange(e, l);
																try {
																	// Se l'item ha una scadenza, cerca e aggiorna l'attività correlata
																	if (l.endDate) {
																		const res = await fetch(`${SERVER_API}/activities/by-title/${l.text}`);
																		const data = await res.json();
																		const activity = data.value;

																		if (activity) {
																			await fetch(`${SERVER_API}/activities/completeActivity`, {
																				method: "POST",
																				headers: { "Content-Type": "application/json" },
																				body: JSON.stringify({ activity_id: activity._id }),
																			});
																		}
																	}

																	// Aggiorna sempre la nota nel database, indipendentemente dall'esistenza dell'attività
																	const updateNoteRes = await fetch(`${SERVER_API}/notes/${id}`, {
																		method: "PUT",
																		headers: { "Content-Type": "application/json" },
																		body: JSON.stringify({
																			...note,
																			toDoList: note.toDoList.map((item) =>
																				item.id === l.id ? { ...item, completed: true } : item
																			),
																		}),
																	});

																	if (!updateNoteRes.ok) {
																		console.error("Errore nell'aggiornamento permanente della nota");
																	} else {
																		refreshNote();
																	}
																} catch (e) {
																	console.error("Errore durante il completamento dell'item:", e);
																}
															}
														}}
													/>
												</div>
												<div>
													<span style={{ fontWeight: "300" }}>
														Titolo:{" "}
													</span>
													<span style={{ fontStyle: "italic" }}>
														{l.text}
													</span>
												</div>
												<div>
													<span style={{ fontWeight: "300" }}>
														Stato:{" "}
													</span>
													<span style={{ fontStyle: "italic" }}>
														{l.completed
															? "Completato"
															: "Non completato"}
													</span>
												</div>
												<div
													style={{
														display: "flex",
														alignItems: "center",
													}}
												>
													{l.endDate ? (
														<div>
															<span style={{ fontWeight: "300" }}>
																Scadenza:{" "}
															</span>
															<span style={{ fontStyle: "italic" }}>
																{new Date(l.endDate).toLocaleString(
																	"it-IT",
																	{
																		day: "2-digit",
																		month: "2-digit",
																		year: "numeric",
																	}
																)}
															</span>
														</div>
													) : (
														<div>
															<span style={{ fontWeight: "300" }}>
																Scadenza:{" "}
															</span>
															<span style={{ fontStyle: "italic" }}>
																Nessuna
															</span>
														</div>
													)}
												</div>
											</div>
										</>
									)}
								</div>
							))}
					</label>
					{isEditing && <button style={{ backgroundColor: "bisque", color: "black" }} onClick={handleAddItem}>Aggiungi Item</button>}

					{/* render tags */}
					<label>
						Tags
						{isEditing && (
							<div className="tags-form">
								<label htmlFor="title" style={{ margin: "0" }}>
									<input
										name="tag"
										value={tag}
										placeholder="Nuovo tag.."
										onChange={(
											e: React.ChangeEvent<HTMLInputElement>
										): void => {
											setTag(e.target.value);
										}}
									/>
								</label>
								<button style={{ margin: "0 0.5em", backgroundColor: "bisque", color: "black" }} onClick={addTag}>
									+
								</button>
							</div>
						)}
						<div className="tags-container">
							{note &&
								note.tags &&
								note.tags.map((tag) => (
									<div className="tag-box">
										{tag}
										{isEditing && (
											<button
												style={{
													marginLeft: "0.5em",
													padding: "0",
												}}
												className="tag-delete"
												onClick={(e: React.MouseEvent<HTMLElement>): void =>
													deleteTag(e, tag)
												}
											>
												X
											</button>
										)}
									</div>
								))}
						</div>
					</label>

					{/* render privacy */}
					<label>
						Privacy: {note.privacy}
						{!isEditing && note.privacy === Privacy.PROTECTED &&
							note.accessList.map((user) => <div>{user}</div>)}
						{isEditing && (
							<>
								<select
									name="privacy"
									value={note.privacy}
									onChange={handlePrivacyChange}
								>
									<option value={Privacy.PUBLIC}>Pubblica</option>
									<option value={Privacy.PROTECTED}>Accesso riservato</option>
									<option value={Privacy.PRIVATE}>Privata</option>
								</select>

								{note.privacy === Privacy.PROTECTED && (
									<>
										{isEditing && (
											<SearchForm
												onItemClick={addUser}
												list={note.accessList}
												excludeUser={loggedUser?.username}
											/>
										)}
										<div className="tags-container">
											{note.accessList.map((user) => (
												<>
													<div className="project-user-box">
														{user}
														{isEditing && (
															<button
																style={{
																	marginLeft: "0.5em",
																	padding: "0",
																	backgroundColor: "#d64545",
																}}
																className="project-user-delete"
																onClick={(
																	e: React.MouseEvent<HTMLButtonElement>
																): void => RemoveUser(e, user)}
															>
																X
															</button>
														)}
													</div>
												</>
											))}
										</div>
									</>
								)}
							</>
						)}
					</label>
					{message && <div className="error-message">{message}</div>}

					{loggedUser.id === note.owner && (
						<>
							{isEditing ? (
								<>
									<button style={{ backgroundColor: "bisque", color: "black" }} onClick={handleUpdateNote}>Aggiorna Nota</button>
									<button
										style={{ backgroundColor: "#d64545" }}
										onClick={handleAbortChanges}
									>
										Annulla Modifiche
									</button>
								</>
							) : (
								<button style={{ backgroundColor: "bisque", color: "black" }} onClick={(): void => setIsEditing(true)}>
									Modifica nota
								</button>
							)}

							{!isEditing ? (
								<>
									<button
										style={{ backgroundColor: "#d64545" }}
										onClick={(): void => setConfirmDelete(true)}
									>
										Cancella Nota
									</button>
									<div className="confirmDelete-background"
										style={{ display: confirmDelete ? "flex" : "none" }}
									>
										<div className="confirmDelete-container">
											<h2>Stai eliminando una nota. Vuoi procedere?</h2>
											<div
												style={{ display: "flex", gap: "2em" }}
											>
												<button
													style={{ backgroundColor: "#ff6b6b" }}
													onClick={(): void => setConfirmDelete(false)}
												>
													Annulla
												</button>
												<button
													onClick={handleDeleteNote}
												>
													Continua
												</button>
											</div>
										</div>
									</div>
								</>
							) : (
								<></>
							)}
						</>
					)}
				</div>
			</div>
		</>
	);
}
