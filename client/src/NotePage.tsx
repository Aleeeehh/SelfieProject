import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Note, { NoteType, type ListItem } from "./types/Note";
import { useNavigate, useParams } from "react-router-dom";
import { marked } from "marked";
import UserResult from "./types/UserResult";
import { Privacy } from "./types/Privacy";
import SearchForm from "./SearchForm";

const baseNote: Note = {
	id: "",
	title: "",
	text: "",
	owner: "",
	tags: [] as string[],
	privacy: Privacy.PRIVATE,
	accessList: [] as UserResult[],
	type: NoteType.NOTE,
	list: [] as ListItem[],
};

const NEW = "new";

export default function NotePage(): React.JSX.Element {
	const { id } = useParams();
	const [note, setNote] = React.useState(baseNote as Note);
	const [tag, setTag] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [isEditing, setIsEditing] = React.useState(id === NEW);
	const [isPreview, setIsPreview] = React.useState(false);
	const nav = useNavigate();

	// On page load, get the note for the user
	React.useEffect(() => {
		if (id !== NEW)
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
	}, [id, nav]);

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setNote({ ...note, [e.target.name]: e.target.value });
	}
	function handlePrivacyChange(e: React.ChangeEvent<HTMLSelectElement>): void {
		setNote({ ...note, privacy: e.target.value as Privacy });
	}

	async function handleCreate(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
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
				setMessage("Errore nell'inserimento della nota");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	async function handleUpdate(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// TODO: validate inputs (not empty, max length)
		try {
			const res = await fetch(`${SERVER_API}/notes/${id}`, {
				method: "PUT",
				body: JSON.stringify(note),
				headers: { "Content-Type": "application/json" },
			});

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				alert("Nota modificata correttamente!");

				setNote(resBody.value as Note);
			} else {
				setMessage("Errore nell'aggiornamento della nota");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	async function handleDelete(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
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

		if (note.tags.includes(tag)) {
			setMessage("Tag già presente nella lista");
			setTag("");
			return;
		}

		if (tag === "") {
			setMessage("Tag vuota non valida");
			return;
		}

		setNote((prevNote) => {
			const newTags: string[] = [];
			console.log(prevNote.tags);

			for (const t of prevNote.tags) {
				newTags.push(t);
			}
			newTags.push(tag);

			return { ...prevNote, tags: newTags };
		});

		setTag(() => {
			return "";
		});
	}

	function deleteTag(e: React.MouseEvent<HTMLElement>, tag: string): void {
		e.preventDefault();
		const tags = note.tags.filter((t) => t !== tag);

		setNote({ ...note, tags });
	}

	function toggleEdit(e: React.MouseEvent<HTMLButtonElement>): void {
		if (isEditing) {
			handleUpdate(e);
		}

		setIsEditing(!isEditing);
		setIsPreview(false);
	}

	function togglePreview(): void {
		setIsPreview(!isPreview);
	}

	function addUser(e: React.MouseEvent<HTMLButtonElement>, user: UserResult): void {
		e.preventDefault();

		if (!note.accessList.find((u) => u.id === user.id))
			// TODO: optimize
			setNote((prevNote) => {
				return {
					...prevNote,
					accessList: [...prevNote.accessList, user],
				};
			});
	}

	function deleteUser(e: React.MouseEvent<HTMLElement>, userId: string): void {
		e.preventDefault();

		setNote((prevNote) => {
			return {
				...prevNote,
				accessList: prevNote.accessList.filter((u) => u.id !== userId),
			};
		});
	}

	function handleAddItem(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		const newItem: ListItem = { name: "", completed: false };
		setNote((prevNote) => {
			return {
				...prevNote,
				list: [...prevNote.list, newItem],
			};
		});
	}

	function handleRemoveItem(e: React.MouseEvent<HTMLButtonElement>, item: ListItem): void {
		e.preventDefault();

		setNote((prevNote) => {
			return {
				...prevNote,
				list: prevNote.list.filter((i) => i.id !== item.id),
			};
		});
	}

	return (
		<>
			<div className="page-title">{id === NEW ? "Crea una nuova nota" : "Modifica nota"}</div>
			<div className="note-container">
				{isEditing ? (
					<label htmlFor="title">
						Titolo
						<input name="title" value={note.title} onChange={handleChange} />
					</label>
				) : (
					<div className="note-title">{note.title}</div>
				)}

				{isEditing ? (
					<>
						<button onClick={togglePreview}>
							{isPreview ? "Modifica" : "Anteprima"}
						</button>
						{note.type === NoteType.NOTE ? (
							isPreview ? (
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
										onChange={handleChange}
									/>
								</label>
							)
						) : (
							<div>
								{/* The note is a todo-list */}
								{note.list.map((l) => (
									<div>
										<input
											type="checkbox"
											checked={l.completed}
											disabled={isPreview}
										/>
										<div>{l.name}</div>
										{l.endDate && (
											<input
												type="date"
												value={l.endDate.toISOString().split("T")[0]}
											/>
										)}
										<button
											onClick={(
												e: React.MouseEvent<HTMLButtonElement>
											): void => handleRemoveItem(e, l)}
											disabled={isPreview}>
											Elimina
										</button>
										{isPreview && (
											<div>
												<button onClick={handleAddItem}>
													Aggiungi Item
												</button>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</>
				) : (
					<div
						className="markdown-content"
						dangerouslySetInnerHTML={{
							__html: marked(note.text) as string,
						}}
					/>
				)}
				<label>
					Tags
					{isEditing && (
						<label htmlFor="title">
							<input
								name="tag"
								value={tag}
								onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
									setTag(e.target.value);
								}}
							/>
							<button style={{ margin: "auto 0.5em" }} onClick={addTag}>
								+
							</button>
						</label>
					)}
					<div className="tags-container">
						{note &&
							note.tags &&
							note.tags.map((tag) => (
								<div className="tag-box">
									{tag}
									{isEditing && (
										<button
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
								<SearchForm onItemClick={addUser} list={note.accessList} />
							)}
						</>
					)}
					<div className="privacy-container">
						{note &&
							note.accessList &&
							note.accessList.map((userId) => (
								<div className="tag-box">
									{userId.username}
									{isEditing && (
										<button
											className="user-delete"
											onClick={(e: React.MouseEvent<HTMLElement>): void =>
												deleteUser(e, userId.id)
											}>
											X
										</button>
									)}
								</div>
							))}
					</div>
				</label>
				{id !== NEW && (
					<button onClick={toggleEdit}>
						{isEditing ? "Salva modifiche" : "Modifica nota"}
					</button>
				)}
				{isEditing && (
					<button
						style={{ backgroundColor: "#ffff00" }}
						onClick={id === NEW ? handleCreate : handleUpdate}>
						{id === NEW ? "Crea Nota" : "Aggiorna Nota"}
					</button>
				)}
				{id !== NEW && !isEditing && (
					<button style={{ backgroundColor: "#ff0000" }} onClick={handleDelete}>
						Cancella Nota
					</button>
				)}
			</div>

			{message && <div>{message}</div>}
		</>
	);
}
