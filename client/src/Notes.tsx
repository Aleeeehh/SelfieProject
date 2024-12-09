import React from "react";
import { SERVER_API } from "./lib/params";
import Note from "./types/Note";
import { ResponseStatus } from "./types/ResponseStatus";
import { ResponseBody } from "./types/ResponseBody";
import { useNavigate } from "react-router-dom";
import { Order } from "./enums";

const PREVIEW_CHARS = 100;
const MAX_TITLE_CHARS = 17;

export default function Notes(): React.JSX.Element {
	const [noteList, setNoteList] = React.useState([] as Note[]);

	const nav = useNavigate();

	async function getAllNotes(): Promise<void> {
		try {
			const res = await fetch(`${SERVER_API}/notes`);
			if (res.status !== 200) {
				nav("/login");
			}

			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				setNoteList(resBody.value);
			} else {
			}
		} catch (e) {
			console.log("Impossibile raggiungere il server");
		}
	}

	React.useEffect(() => {
		getAllNotes();
	}, []);

	async function handleDuplicate(
		e: React.MouseEvent<HTMLButtonElement>,
		note: Note
	): Promise<void> {
		e.preventDefault();
		try {
			const newNote: Note = {
				title: "Copia di: " + note.title,
				text: note.text,
				owner: "",
				tags: note.tags,
				privacy: note.privacy,
				accessList: note.accessList,
				toDoList: note.toDoList,
			};

			const res = await fetch(`${SERVER_API}/notes`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newNote),
			});

			const data = (await res.json()) as ResponseBody;

			console.log(data);

			if (data.status === ResponseStatus.GOOD) {
				console.log("Nota duplicata correttamente");
				getAllNotes();
			} else {
				alert(data.message || "Errore durante la duplicazione della nota");
			}
		} catch (e) {
			alert("Impossibile raggiungere il server");
		}
	}

	async function handleDelete(e: React.MouseEvent<HTMLButtonElement>, note: Note): Promise<void> {
		e.preventDefault();
		try {
			const res = await fetch(`${SERVER_API}/notes/${note.id}`, {
				method: "DELETE",
			});

			const data = (await res.json()) as ResponseBody;

			console.log(data);

			if (data.status === ResponseStatus.GOOD) {
				console.log("Nota eliminata correttamente");
				getAllNotes();
			} else {
				alert(data.message || "Errore durante l'eliminazione della nota");
			}
		} catch (e) {
			alert("Impossibile raggiungere il server");
		}
	}

	function sortBy(method: Order): void {
		switch (method) {
			case Order.NAME:
				setNoteList([...noteList].sort((a, b) => a.title.localeCompare(b.title)));
				break;
			case Order.NAME_DESC:
				setNoteList([...noteList].sort((a, b) => b.title.localeCompare(a.title)));
				break;
			case Order.DATE:
				setNoteList(
					[...noteList].sort((a, b) => {
						if (!a.updatedAt) return 1;
						if (!b.updatedAt) return -1;
						return a.updatedAt.toString().localeCompare(b.updatedAt.toString());
					})
				);
				break;
			case Order.DATE_DESC:
				setNoteList(
					[...noteList].sort((a, b) => {
						if (!b.updatedAt) return 1;
						if (!a.updatedAt) return -1;
						return b.updatedAt.toString().localeCompare(a.updatedAt.toString());
					})
				);
				break;
			case Order.LENGTH:
				setNoteList([...noteList].sort((a, b) => a.text.length - b.text.length));
				break;
			case Order.LENGTH_DESC:
				setNoteList([...noteList].sort((a, b) => b.text.length - a.text.length));
				break;

			default:
				break;
		}
	}

	return (
			<div className="note-outer-container">
				<a href={"/notes/new"}>
					<button
						style={{
							backgroundColor: "bisque",
							color: "black",
							boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
						}}
					>
						Crea nuova nota
					</button>
				</a>
				<label className="sort-label" htmlFor="sort-select">
					Ordina per:
					<select
						className="sort-select"
						onChange={(e): void => sortBy(e.target.value as Order)}
					>
						<option value={Order.NAME}>Titolo (A-Z)</option>
						<option value={Order.NAME_DESC}>Titolo (Z-A)</option>
						<option value={Order.LENGTH}>Più corta</option>
						<option value={Order.LENGTH_DESC}>Più lunga</option>
						<option value={Order.DATE}>Meno recente</option>
						<option value={Order.DATE_DESC}>Più recente</option>
					</select>
				</label>
				<div className="notes-list-container">
					{noteList.map((note) => (
						<a href={`/notes/${note.id}`}>
							<div className="card-note">
								<div className="card-note-title">
									<h3>
										{note.title.length > MAX_TITLE_CHARS
											? note.title.substring(0, MAX_TITLE_CHARS) + "..."
											: note.title}
									</h3>
								</div>
								<div className="card-note-text">
									<p>
										{note.text.length > PREVIEW_CHARS
											? note.text.substring(0, PREVIEW_CHARS) + "..."
											: note.text}
									</p>
								</div>
								<div className="card-note-date">
									<p style={{ fontWeight: "bold" }}>
										Ultima modifica:{" "}
										{note.updatedAt
											? new Date(note.updatedAt).toLocaleDateString("it-IT")
											: "N/A"}
									</p>
								</div>
								<div className="card-note-actions">
									<button
										onClick={(
											e: React.MouseEvent<HTMLButtonElement>
										): Promise<void> => handleDuplicate(e, note)}
									>
										Duplica
									</button>
									<button
										style={{ backgroundColor: "#ff6b6b" }}
										onClick={(
											e: React.MouseEvent<HTMLButtonElement>
										): Promise<void> => handleDelete(e, note)}
									>
										Cancella
									</button>
								</div>
							</div>
						</a>
					))}
				</div>
			</div>
	);
}
