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
	//const [scadenzaItem, setScadenzaItem] = React.useState([] as string[]);
	//const [titoloItem, setTitoloItem] = React.useState([] as string[]);

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
				setMessage("Impossibile raggiungere il server");
				nav("/notes");
			});

		setCount(0);
		setDeletedItems([]);
	}
	// On page load, get the note for the user
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

		// TODO: validate inputs (not empty, max length)
		try {
			const res = await fetch(`${SERVER_API}/notes/${id}`, {
				method: "PUT",
				body: JSON.stringify({ ...note, deletedItems }),
				headers: { "Content-Type": "application/json" },
			});

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				alert("Nota aggiornata correttamente!");
				refreshNote();
				setIsEditing(false);
			} else {
				setMessage("Errore nell'aggiornamento della nota");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
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
		// e.preventDefault();
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
	}

	return (
		<>
			<div className="note-background">
				<div className="note-container">
					<div className="note-page-title">
						{isEditing ? "Modifica nota" : note.title}
						<a href="/notes" className="note-close-link">
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
														style={{width: "200px", marginBottom: "5px"}}
														placeholder="Nuovo to-do item"
														onChange={(
															e: React.ChangeEvent<HTMLInputElement>
														): void => {
															handleUpdateTextItem(e, l);
														}}
													/>
													<div style={{display: "flex", alignItems: "center", flexDirection: "column"}}>
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
																		): void => handleUpdateDateItem(e, l)}
																	/>
																</label>
																<button
																	onClick={(
																		e: React.MouseEvent<HTMLButtonElement>
																	): void => handleRemoveDateItem(e, l)}>
																	Rimuovi Scadenza
																</button>
															</>
														) : (
															<button
																onClick={(
																	e: React.MouseEvent<HTMLButtonElement>
																): void => handleAddDateItem(e, l)}>
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
													<div style={{display: "flex", alignItems: "center"}}>
														<input
															id="todo-completed"
															type="checkbox"
															style={{height: "15px", width: "15px"}}
															checked={l.completed}
															onChange={(
																e: React.ChangeEvent<HTMLInputElement>
															): void => handleCheckboxChange(e, l)}
														/>
													</div>
													<div>
														<span style={{fontWeight: "300"}}>
															Titolo:{" "}
														</span>
														<span style={{fontStyle: "italic"}}>
															{l.text}
														</span>
													</div>
													<div>
														<span style={{fontWeight: "300"}}>
															Stato:{" "}
														</span>
														<span style={{fontStyle: "italic"}}>
															{l.completed ? "Completato" : "Non completato"}
														</span>
													</div>
													<div style={{display: "flex", alignItems: "center"}}>
														{l.endDate ?(
															<div>
																<span style={{fontWeight: "300"}}>
																	Scadenza:{" "}
																</span>
																<span style={{fontStyle: "italic"}}>
																	{new Date(l.endDate).toLocaleString("it-IT", {
																		day: "2-digit",
																		month: "2-digit",
																		year: "numeric",
																	})}
																</span>
															</div>
														) : (
															<div>
																<span style={{fontWeight: "300"}}>
																	Scadenza:{" "}
																</span>
																<span style={{fontStyle: "italic"}}>
																	Nessuna
																</span>
															</div>
														)}
													</div>
												</div>
											</>
										)}
									</div>
								))
							}
						</label>
						{isEditing && <button onClick={handleAddItem}>Aggiungi Item</button>}
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
						{note.privacy === Privacy.PROTECTED &&
							note.accessList.map((user) => <div>{user}</div>)}
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
					{message && <div>{message}</div>}

					{loggedUser.id === note.owner && (
						<>
							{isEditing ? (
								<>
									<button onClick={handleUpdateNote}>Aggiorna Nota</button>
									<button style={{ backgroundColor: "#d64545" }} onClick={handleAbortChanges}>Annulla Modifiche</button>
								</>
							) : (
								<button onClick={(): void => setIsEditing(true)}>
									Modifica nota
								</button>
							)}

							{!isEditing ? (
								<button
									style={{ backgroundColor: "red" }}
									onClick={handleDeleteNote}>
									Cancella Nota
								</button>
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
