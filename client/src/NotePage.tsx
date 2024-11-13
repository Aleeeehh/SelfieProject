import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Note, { type ListItem } from "./types/Note";
import { useNavigate, useParams } from "react-router-dom";
import { marked } from "marked";
// import UserResult from "./types/UserResult";
import { Privacy } from "./types/Privacy";
import SearchForm from "./SearchForm";

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

//TODO: aggiungere un bottone per uscire dalla creazione di una nota

const NEW = "new";

export default function NotePage(): React.JSX.Element {
	const { id } = useParams();
	const [note, setNote] = React.useState(baseNote as Note);
	const [tag, setTag] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [isEditing, setIsEditing] = React.useState(id === NEW);
	const [isPreview, setIsPreview] = React.useState(false);
	const nav = useNavigate();

	function updateNote(): void {
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
				setMessage("Impossibile raggiungere il server");
				nav("/notes");
			});
	}
	// On page load, get the note for the user
	React.useEffect(() => {
		if (id !== NEW) updateNote();
	}, []);

	function handleTextChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setNote({ ...note, [e.target.name]: e.target.value });
	}

	function handlePrivacyChange(e: React.ChangeEvent<HTMLSelectElement>): void {
		e.preventDefault();

		console.log("Updating privacy to:", e.target.value);
		fetch(`${SERVER_API}/notes/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				privacy: e.target.value,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					updateNote();
				}
			})
			.catch((e) => {
				setMessage(e || "Impossibile raggiungere il server");
			});
	}

	async function handleCreateNote(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		try {
			const res = await fetch(`${SERVER_API}/notes`, {
				method: "POST",
				body: JSON.stringify(note),
				headers: { "Content-Type": "application/json" },
			});

			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				const newNoteId: string = resBody.value;
				alert("Nota creata correttamente!");

				// redirect to update page of the created note
				nav(`/notes/${newNoteId}`);
			} else {
				setMessage(resBody.message || "Errore nel caricamento della nota");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	function updateNoteTitleAndText(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();

		fetch(`${SERVER_API}/notes/${id}`, {
			method: "PUT",
			body: JSON.stringify({
				title: note.title,
				text: note.text,
			}),
			headers: { "Content-Type": "application/json" },
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					updateNote();
				} else {
					nav("/notes");
				}
			})
			.catch(() => {
				setMessage("Impossibile raggiungere il server");
				nav("/notes");
			});
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
				alert("Nota cancellata correttamente!");
				nav("/notes");
			} else {
				setMessage("Errore della cancellazione della nota");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	function addTag(e: React.MouseEvent<HTMLElement>): void {
		e.preventDefault();
		const tags = note.tags.concat(tag);
		fetch(`${SERVER_API}/notes/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				tags,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					updateNote();
				} else {
					nav("/notes");
				}
			})
			.catch(() => {
				setMessage("Impossibile raggiungere il server");
				nav("/notes");
			});
	}

	function deleteTag(e: React.MouseEvent<HTMLElement>, tag: string): void {
		e.preventDefault();
		const tags = note.tags.filter((t) => t !== tag);
		fetch(`${SERVER_API}/notes/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				tags,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					updateNote();
				} else {
					nav("/notes");
				}
			})
			.catch(() => {
				setMessage("Impossibile raggiungere il server");
				nav("/notes");
			});
	}

	function toggleEdit(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setIsEditing(!isEditing);
		setIsPreview(false);
	}

	function togglePreview(): void {
		setIsPreview(!isPreview);
	}

	function addUser(e: React.ChangeEvent<HTMLSelectElement>, user: string): void {
		e.preventDefault();

		const newAccessList = [...note.accessList, user];

		fetch(`${SERVER_API}/notes/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				accessList: newAccessList,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					updateNote();
				}
			})
			.catch((e) => {
				setMessage(e || "Impossibile raggiungere il server");
			});
	}

	function RemoveUser(e: React.MouseEvent<HTMLButtonElement>, user: string): void {
		e.preventDefault();

		const newAccessList = note.accessList.filter((u) => u !== user);

		fetch(`${SERVER_API}/notes/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				accessList: newAccessList,
			}),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					updateNote();
				}
			})
			.catch((e) => {
				setMessage(e || "Impossibile raggiungere il server");
			});
	}

	function handleAddItem(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		fetch(`${SERVER_API}/lists/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				noteId: note.id,
				text: "Nuovo item",
				completed: false,
				endDate: undefined,
			}),
		})
			.then((res) => res.json())
			.then((res) => {
				console.log(res);
				if (res.status === ResponseStatus.GOOD) {
					updateNote();
				}
			})
			.catch((e) => {
				console.log(e);
				setMessage(e || "Impossibile raggiungere il server");
			});
	}

	function handleRemoveItem(e: React.MouseEvent<HTMLButtonElement>, item: ListItem): void {
		e.preventDefault();
		fetch(`${SERVER_API}/lists/${item.id}`, {
			method: "DELETE",
		})
			.then((res) => res.json())
			.then((res) => {
				console.log(res);
				if (res.status === ResponseStatus.GOOD) {
					updateNote();
				}
			})
			.catch((e) => {
				console.log(e);
				setMessage(e || "Impossibile raggiungere il server");
			});
	}

	function handleUpdateTextItem(e: React.MouseEvent<HTMLButtonElement>, item: ListItem): void {
		e.preventDefault();

		fetch(`${SERVER_API}/lists/${item.id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ text: item.text }),
		})
			.then((res) => res.json())
			.then((res) => {
				console.log(res);
				if (res.status === ResponseStatus.GOOD) {
					updateNote();
				}
			})
			.catch((e) => {
				console.log(e);
				setMessage(e || "Impossibile raggiungere il server");
			});
	}

	function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>, item: ListItem): void {
		e.preventDefault();

		fetch(`${SERVER_API}/lists/${item.id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ completed: e.target.checked }),
		})
			.then((res) => res.json())
			.then((res) => {
				console.log(res);
				if (res.status === ResponseStatus.GOOD) {
					updateNote();
				}
			})
			.catch((e) => {
				console.log(e);
				setMessage(e || "Impossibile raggiungere il server");
			});
	}

	return (
		<>
			<div className="note-background">
				<div className="note-container">
					<div className="note-page-title">
						{id === NEW ? "Crea una nuova nota" : "Modifica nota"}
						<a href="/notes" className="close-link">
							X
						</a>
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
							<button onClick={togglePreview}>
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
							<button onClick={updateNoteTitleAndText}>
								Aggiorna Titolo e Testo
							</button>
						</>
					) : (
						<>
							<div className="note-title">{note.title}</div>
							<div
								className="markdown-content"
								dangerouslySetInnerHTML={{
									__html: marked(note.text) as string,
								}}
							/>
						</>
					)}

					{/* render to do list */}
					<div className="note-list-container">
						<div>To Do List</div>
						{note.toDoList &&
							note.toDoList.map((l) => (
								<div>
									{isEditing ? (
										<>
											<input
												type="text"
												value={l.text}
												onChange={(
													e: React.ChangeEvent<HTMLInputElement>
												): void => {
													setNote((prevNote) => {
														return {
															...prevNote,
															toDoList: prevNote.toDoList.map((i) => {
																if (i.id === l.id) {
																	return {
																		...i,
																		text: e.target.value,
																	};
																}
																return i;
															}),
														};
													});
												}}
											/>
											<button
												onClick={(
													e: React.MouseEvent<HTMLButtonElement>
												): void => handleUpdateTextItem(e, l)}>
												Aggiorna Nome
											</button>
										</>
									) : (
										<div>{l.text}</div>
									)}
									{isEditing ? (
										<input
											type="checkbox"
											checked={l.completed}
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>
											): void => handleCheckboxChange(e, l)}
										/>
									) : (
										<div>{l.completed ? "Completato" : "Non completato"}</div>
									)}
									{l.endDate && (
										<input
											type="date"
											value={l.endDate.toISOString().split("T")[0]}
										/>
									)}
									{isEditing && (
										<button
											onClick={(
												e: React.MouseEvent<HTMLButtonElement>
											): void => handleRemoveItem(e, l)}>
											Elimina
										</button>
									)}
								</div>
							))}
						{isEditing && <button onClick={handleAddItem}>Aggiungi Item</button>}
					</div>
					{/* render tags */}
					<label>
						Tags
						{isEditing && (
							<div className="tags-form">
								<label htmlFor="title" style={{ margin: "0" }}>
									<input
										name="tag"
										value={tag}
										onChange={(
											e: React.ChangeEvent<HTMLInputElement>
										): void => {
											setTag(e.target.value);
										}}
									/>
								</label>
								<button style={{ margin: "0 0.5em" }} onClick={addTag}>
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
												}>
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
						{isEditing && (
							<>
								<select
									name="privacy"
									value={note.privacy}
									onChange={handlePrivacyChange}>
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
											/>
										)}
										<div>
											{note.accessList.map((user) => (
												<>
													<div>{user}</div>
													{isEditing && (
														<button
															onClick={(
																e: React.MouseEvent<HTMLButtonElement>
															): void => RemoveUser(e, user)}>
															X
														</button>
													)}
												</>
											))}
										</div>
									</>
								)}
							</>
						)}
					</label>

					{id !== NEW && (
						<button onClick={toggleEdit}>
							{isEditing ? "Termina modifiche" : "Modifica nota"}
						</button>
					)}

					{id === NEW ? (
						<button style={{ backgroundColor: "blue" }} onClick={handleCreateNote}>
							Crea Nota
						</button>
					) : !isEditing ? (
						<button style={{ backgroundColor: "red" }} onClick={handleDeleteNote}>
							Cancella Nota
						</button>
					) : (
						<></>
					)}
				</div>
			</div>

			{message && <div>{message}</div>}
		</>
	);
}
