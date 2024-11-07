import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Note, { type ListItem } from "./types/Note";
import { useNavigate, useParams } from "react-router-dom";
// import { marked } from "marked";
// import UserResult from "./types/UserResult";
import { Privacy } from "./types/Privacy";
import SearchForm from "./SearchForm";
import type Project from "./types/Project";
import type Activity from "./types/Activity";

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
const baseProject: Project = {
	id: "",
	title: "",
	description: "",
	owner: "",
	accessList: [] as string[],
	activityList: [] as Activity[],
	note: baseNote,
};

//TODO: aggiungere un bottone per uscire dalla creazione di una nota

const NEW = "new";

export default function ProjectPage(): React.JSX.Element {
	const { id } = useParams();
	const [project, setProject] = React.useState(baseProject);
	const [message, setMessage] = React.useState("");
	const [isEditing, setIsEditing] = React.useState(id === NEW);
	// const [isPreview, setIsPreview] = React.useState(false);
	const nav = useNavigate();

	// On page load, get the note for the user
	React.useEffect(() => {
		if (id !== NEW)
			fetch(`${SERVER_API}/projects/${id}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.status === ResponseStatus.GOOD) {
						setProject(data.value as Project);
						console.log(data.value);
					} else {
						nav("/projects");
					}
				})
				.catch(() => {
					setMessage("Impossibile raggiungere il server");
					nav("/projects");
				});
	}, [id, nav]);

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setProject({ ...project, [e.target.name]: e.target.value });
	}
	/*function handlePrivacyChange(e: React.ChangeEvent<HTMLSelectElement>): void {
		setNote({ ...note, privacy: e.target.value as Privacy });
	}*/

	async function handleCreate(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		/*try {
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
		}*/
	}

	async function handleUpdate(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// TODO: validate inputs (not empty, max length)
		/*try {
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
				setMessage(resBody.message || "Errore nell'aggiornamento della nota");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}*/
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

	/*function addTag(e: React.MouseEvent<HTMLElement>): void {
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
*/
	function toggleEdit(e: React.MouseEvent<HTMLButtonElement>): void {
		if (isEditing) {
			handleUpdate(e);
		}

		setIsEditing(!isEditing);
		// setIsPreview(false);
	}

	/* function togglePreview(): void {
		setIsPreview(!isPreview);
	}*/

	function addUser(e: React.ChangeEvent<HTMLSelectElement>, user: string): void {
		e.preventDefault();

		if (!project.accessList.includes(user))
			// TODO: optimize
			setProject((prevProj) => {
				return {
					...prevProj,
					accessList: [...prevProj.accessList, user],
				};
			});
	}

	/* function deleteUser(e: React.MouseEvent<HTMLElement>, username: string): void {
		e.preventDefault();

		setProject((prevProj) => {
			return {
				...prevProj,
				accessList: prevProj.accessList.filter((u) => u !== username),
			};
		});
	}

	function handleAddItem(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		const newItem: ListItem = { text: "", completed: false };
		setNote((prevNote) => {
			return {
				...prevNote,
				list: [...prevNote.text, newItem],
			};
		});
	}

	function handleRemoveItem(e: React.MouseEvent<HTMLButtonElement>, item: ListItem): void {
		e.preventDefault();

		setNote((prevNote) => {
			return {
				...prevNote,
				list: prevNote.toDoList.filter((i) => i.id !== item.id),
			};
		});
	}*/

	return (
		<>
			<div className="project-background">
				<div className="project-container">
					<div className="page-title">
						{id === NEW ? "Crea un nuovo progetto" : "Modifica progetto"}
					</div>
					{/* render title */}
					{isEditing ? (
						<label htmlFor="title">
							Titolo
							<input name="title" value={project.title} onChange={handleChange} />
						</label>
					) : (
						<div className="project-title">{project.title}</div>
					)}
					{/* render description */}
					{isEditing ? (
						<label htmlFor="description">
							Descrizione
							<input
								name="description"
								value={project.description}
								onChange={handleChange}
							/>
						</label>
					) : (
						<div className="project-description">{project.description}</div>
					)}
					{/* render access list */}
					<div>
						{isEditing && (
							<SearchForm onItemClick={addUser} list={project.accessList} />
						)}
						<div>
							{project.accessList.map((u) => (
								<div>{u}</div>
							))}
						</div>
					</div>

					{/* render note */}
					{/*isEditing ? (
						<>
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
										onChange={handleChange}
									/>
								</label>
							)}
						</>
					) : (
						<div
							className="markdown-content"
							dangerouslySetInnerHTML={{
								__html: marked(note.text) as string,
							}}
						/>
					)*/}
					{/* render activity list */}
					{/*note.toDoList &&
						note.toDoList.map((l) => (
							<div>
								<input type="checkbox" checked={l.completed} disabled={isEditing} />
								<div>{l.text}</div>
								{l.endDate && (
									<input
										type="date"
										value={l.endDate.toISOString().split("T")[0]}
									/>
								)}
								<button
									onClick={(e: React.MouseEvent<HTMLButtonElement>): void =>
										handleRemoveItem(e, l)
									}
									disabled={isEditing}>
									Elimina
								</button>
								{isEditing && (
									<div>
										<button onClick={handleAddItem}>Aggiungi Item</button>
									</div>
								)}
							</div>
						))*/}

					{id !== NEW && (
						<button onClick={toggleEdit}>
							{isEditing ? "Salva modifiche" : "Modifica progetto"}
						</button>
					)}
					{isEditing && (
						<button
							style={{ backgroundColor: "blue" }}
							onClick={id === NEW ? handleCreate : handleUpdate}>
							{id === NEW ? "Crea Progetto" : "Aggiorna progetto"}
						</button>
					)}
					{id !== NEW && !isEditing && (
						<button style={{ backgroundColor: "red" }} onClick={handleDelete}>
							Cancella Progetto
						</button>
					)}
				</div>
			</div>

			{message && <div>{message}</div>}
		</>
	);
}
