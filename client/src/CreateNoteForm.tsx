import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Note, { type ListItem } from "./types/Note";
import { useNavigate } from "react-router-dom";
import { marked } from "marked";
// import UserResult from "./types/UserResult";
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

//TODO: aggiungere un bottone per uscire dalla creazione di una nota

export default function CreateNoteForm(): React.JSX.Element {
	const [note, setNote] = React.useState(baseNote as Note);
	const [tag, setTag] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [isPreview, setIsPreview] = React.useState(false);
	const [count, setCount] = React.useState(0);
	const nav = useNavigate();

	function handleTextChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setNote({ ...note, [e.target.name]: e.target.value });
	}

	function handlePrivacyChange(e: React.ChangeEvent<HTMLSelectElement>): void {
		e.preventDefault();

		setNote({ ...note, privacy: e.target.value as Privacy });
	}

	async function getCurrentUser(): Promise<Promise<any> | null> {
		try {
			const res = await fetch(`${SERVER_API}/users`);
			if (!res.ok) { // Controlla se la risposta non è ok
				setMessage("Utente non autenticato");
				return null; // Restituisci null se non autenticato
			}
			//console.log("Questa è la risposta alla GET per ottenere lo user", res);
			const data: User = await res.json();
			//console.log("Questo è il json della risposta", data);
			return data;
		} catch (e) {
			setMessage("Impossibile recuperare l'utente corrente");
			return null;
		}
	}

	async function handleCreateNote(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		try {

			//genera un idEventoNotificaCondiviso
			//const idEventoNotificaCondiviso = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
			console.log("Creo la nota:", note);





			//crea la nota nella lista delle note
			const res = await fetch(`${SERVER_API}/notes`, {
				method: "POST",
				body: JSON.stringify(note),
				headers: { "Content-Type": "application/json" },
			});

			//crea le attività nella lista delle attività
			const currentUser = await getCurrentUser();
			const owner = currentUser.value._id.toString();
			const todoList = note.toDoList;

			for (const item of todoList) {
				console.log(item);
				//crea l'attività nella lista delle attività

				if (item.endDate) { //se esiste una scadenza per l'item
					const res2 = await fetch(`${SERVER_API}/activities`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							idEventoNotificaCondiviso: note.id,
							title: item.text,
							deadline: item.endDate?.toISOString(),
							accessList: [owner],
							accessListAccepted: [owner],
							description: "Item in ToDoList di una nota",
							owner: owner,
						}),
					});
					console.log(res2);
				}
			}

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
			toDoList: [...note.toDoList, { text: "", completed: false, id: count.toString() }],
		});
		setCount(count + 1);
	}

	function handleRemoveItem(e: React.MouseEvent<HTMLButtonElement>, item: ListItem): void {
		e.preventDefault();

		setNote({
			...note,
			toDoList: note.toDoList.filter((i) => i !== item),
		});
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

		setNote({
			...note,
			toDoList: note.toDoList.map((i) =>
				i.id === item.id ? { ...i, completed: e.target.checked } : i
			),
		});
	}

	return (
		<>
			<div className="note-background">
				<div className="note-container">
					<div className="note-page-title">
						{"Crea una nuova nota"}
						<a href="/notes" className="note-close-link">
							X
						</a>
					</div>

					{/* render title and text */}
					<label htmlFor="title">
						Titolo
						<input name="title" value={note.title} onChange={handleTextChange} />
					</label>
					<button onClick={togglePreview}>{isPreview ? "Modifica" : "Anteprima"}</button>
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
							<textarea name="text" value={note.text} onChange={handleTextChange} />
						</label>
					)}

					{/* render to do list */}
					<div className="note-list-container">
						<label>To Do List
							{note.toDoList &&
								note.toDoList.map((l) => (
									<div key={l.id}>
										<input
											type="text"
											value={l.text}
											onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
												handleUpdateTextItem(e, l)
											}
										/>
										<input
											type="checkbox"
											checked={l.completed}
											onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
												handleCheckboxChange(e, l)
											}
										/>

										{l.endDate ? (
											<>
												<label>
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

										<button
											onClick={(e: React.MouseEvent<HTMLButtonElement>): void =>
												handleRemoveItem(e, l)
											}>
											Elimina
										</button>
									</div>
								))
							}
						</label>
						<button onClick={handleAddItem}>Aggiungi Item</button>
					</div>

					{/* render tags */}
					<label>
						Tags
						<div className="tags-form">
							<label htmlFor="title" style={{ margin: "0" }}>
								<input
									name="tag"
									value={tag}
									onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
										setTag(e.target.value);
									}}
								/>
							</label>
							<button style={{ margin: "0 0.5em" }} onClick={addTag}>
								+
							</button>
						</div>
						<div className="tags-container">
							{note &&
								note.tags &&
								note.tags.map((tag) => (
									<div className="tag-box">
										{tag}

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
									</div>
								))}
						</div>
					</label>
					{/* render privacy */}
					<label>
						Privacy: {note.privacy}
						<select name="privacy" value={note.privacy} onChange={handlePrivacyChange}>
							<option value={Privacy.PUBLIC}>Pubblica</option>
							<option value={Privacy.PROTECTED}>Accesso riservato</option>
							<option value={Privacy.PRIVATE}>Privata</option>
						</select>
						{note.privacy === Privacy.PROTECTED && (
							<>
								<SearchForm onItemClick={addUser} list={note.accessList} />

								<div>
									{note.accessList.map((user) => (
										<>
											<div>{user}</div>

											<button
												onClick={(
													e: React.MouseEvent<HTMLButtonElement>
												): void => RemoveUser(e, user)}>
												X
											</button>
										</>
									))}
								</div>
							</>
						)}
					</label>
					{message && <div>{message}</div>}

					<button style={{ backgroundColor: "blue" }} onClick={handleCreateNote}>
						Crea Nota
					</button>
				</div>
			</div>
		</>
	);
}
