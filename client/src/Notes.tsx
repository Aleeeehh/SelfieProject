import React from "react";
import { SERVER_API } from "./params/params";
import Note from "./types/Note";
import { ResponseStatus } from "./types/ResponseStatus";
import { ResponseBody } from "./types/ResponseBody";
import { useNavigate } from "react-router-dom";
import { Order } from "./enums";

const PREVIEW_CHARS = 100;
export default function Notes(): React.JSX.Element {
	const [noteList, setNoteList] = React.useState([] as Note[]);
	const [message, setMessage] = React.useState("");

	const nav = useNavigate();
	// On page load, get the notes for the user

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
			setMessage("Impossibile raggiungere il server");
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
			const res = await fetch(`${SERVER_API}/notes`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: note.title,
					text: note.text,
					owner: note.owner,
					tags: note.tags,
				}),
			});

			const data = (await res.json()) as ResponseBody;

			console.log(data);

			if (data.status === ResponseStatus.GOOD) {
				alert("Nota duplicata correttamente");
				getAllNotes();
			} else {
				setMessage("Errore durante la duplicazione della nota");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
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
				alert("Nota eliminata correttamente");
				getAllNotes();
			} else {
				setMessage("Errore durante l'eliminazione della nota");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	// TODO: sort up and down (not only one direction)
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
		<div className="note-background">
			<div className="note-outer-container">
				<a href={"/notes/new"}>
					<button>Crea nota</button>
				</a>
				<label htmlFor="sort-select">Ordina per:
					<select className="sort-select" onChange={(e): void => sortBy(e.target.value as Order)}>
						<option value={Order.NAME}>Titolo (A-Z)</option>
						<option value={Order.NAME_DESC}>Titolo (Z-A)</option>
						<option value={Order.LENGTH}>Più corta</option>
						<option value={Order.LENGTH_DESC}>Più lunga</option>
						<option value={Order.DATE}>Meno recente</option>
						<option value={Order.DATE_DESC}>Più recente</option>
					</select>
				</label>
				{/*<table className="note-list-container">
					<thead>
						<tr>
							<th style={{ cursor: "pointer" }} onClick={(): void => sortBy(Order.NAME)}>
								Titolo
							</th>
							<th
								style={{ cursor: "pointer" }}
								onClick={(): void => sortBy(Order.LENGTH)}>
								Testo
							</th>
							<th style={{ cursor: "pointer" }} onClick={(): void => sortBy(Order.DATE)}>
								Ultima Modifica
							</th>
							<th>Duplica</th> <th>Elimina</th>
						</tr>
					</thead>
					<tbody>
						{noteList.map((note) => (
							<tr className="note-card">
								<a className="note-card-link" href={`/notes/${note.id}`}>
									<td className="note-card-title">{note.title}</td>
									<td className="note-card-text">
										{note.text.length > PREVIEW_CHARS
											? note.text.substring(0, PREVIEW_CHARS) + "..."
											: note.text}
									</td>
									<td className="note-card-date">
										{note.updatedAt ? (
											<>
												{new Date(note.updatedAt).toLocaleDateString("it-IT")}{" "}
												{new Date(note.updatedAt).toLocaleTimeString("it-IT", {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</>
										) : (
											"N/A"
										)}
									</td>
								</a>
								<td>
									<button 
										style={{borderRadius: "8px"}}
										onClick={(
											e: React.MouseEvent<HTMLButtonElement>
										): Promise<void> => handleDuplicate(e, note)}>
										Duplica
									</button>
								</td>
								<td>
									<button
										style={{borderRadius: "8px"}}
										onClick={(
											e: React.MouseEvent<HTMLButtonElement>
										): Promise<void> => handleDelete(e, note)}>
										Cancella
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>*/}
				<div className="notes-list-container">
					{noteList.map((note) => (
						<a href={`/notes/${note.id}`}>
							<div className="card-note">
								<div className="card-note-title">
									<h3>{note.title}</h3>
								</div>
								<div className="card-note-text">
									<p>{note.text.length > PREVIEW_CHARS ? note.text.substring(0, PREVIEW_CHARS) + "..." : note.text}</p>
								</div>
								<div className="card-note-date">
									<p>Ultima modifica:{" "}{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString("it-IT") : "N/A"}</p>
								</div>
								<div className="card-note-actions">
									<button 
										style={{borderRadius: "8px"}}
										onClick={(
											e: React.MouseEvent<HTMLButtonElement>
										): Promise<void> => handleDuplicate(e, note)}>
										Duplica
									</button>
									<button
										style={{borderRadius: "8px"}}
										onClick={(
											e: React.MouseEvent<HTMLButtonElement>
										): Promise<void> => handleDelete(e, note)}>
										Cancella
									</button>
								</div>
							</div>
						</a>
					))}
				</div>
				{message && <div>{message}</div>}
			</div>
		</div>
	);
}
