import React from "react";
import { SERVER_API } from "./params/params";
import Note from "./types/Note";
import { ResponseStatus } from "./types/ResponseStatus";
import { ResponseBody } from "./types/ResponseBody";
import { useNavigate } from "react-router-dom";
import { Order } from "./enums";

const PREVIEW_CHARS = 200;
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
			case Order.DATE:
				setNoteList(
					[...noteList].sort((a, b) => {
						if (!a.updatedAt) return 1;
						if (!b.updatedAt) return -1;
						return a.updatedAt.toString().localeCompare(b.updatedAt.toString());
					})
				);
				break;
			case Order.LENGTH:
				setNoteList([...noteList].sort((a, b) => a.text.length - b.text.length));
				break;
			default:
				break;
		}
	}

	return (
		<div className="note-outer-container">
			<a href={"/notes/new"}>
				<button>Create New Note</button>
			</a>
			<table className="note-list-container">
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
								<td className="note-card-date">{note.updatedAt?.toString()}</td>
							</a>
							<td>
								<button
									onClick={(
										e: React.MouseEvent<HTMLButtonElement>
									): Promise<void> => handleDuplicate(e, note)}>
									Duplica
								</button>
							</td>
							<td>
								<button
									onClick={(
										e: React.MouseEvent<HTMLButtonElement>
									): Promise<void> => handleDelete(e, note)}>
									Cancella
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{message && <div>{message}</div>}
		</div>
	);
}
