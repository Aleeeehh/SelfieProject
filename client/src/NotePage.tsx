import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Note from "./types/Note";
import { useParams } from "react-router-dom";

const baseNote: Note = {
	id: "",
	title: "",
	text: "",
	owner: "",
	tags: [],
};

export default function NotePage(): React.JSX.Element {
	const { id } = useParams();
	const [note, setNote] = React.useState(baseNote as Note);
	const [tag, setTag] = React.useState("");
	const [message, setMessage] = React.useState("");

	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/notes/${id}`);
				const resBody = (await res.json()) as ResponseBody;

				if (resBody.status === ResponseStatus.GOOD) {
					setNote(resBody.value);
					console.log(resBody.value);
				} else {
					setMessage("Nota non trovata");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, [id]);

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setNote({ ...note, [e.target.name]: e.target.value });
	}

	async function handleUpdate(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		try {
			const res = await fetch(`${SERVER_API}/notes/${id}`, {
				method: "PUT",
				body: JSON.stringify(note),
				headers: { "Content-Type": "application/json" },
			});

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				setNote(resBody.value as Note);
			} else {
				setMessage("Errore nell'aggiornamento della nota");
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

	return (
		<>
			<div className="note-container">
				<label htmlFor="title">
					Titolo
					<input name="title" value={note.title} onChange={handleChange} />
				</label>
				<label htmlFor="title">
					Testo
					<textarea name="text" value={note.text} onChange={handleChange} />
				</label>
				<label>
					Tags
					<label htmlFor="title">
						{/* <span
							style={{
								fontWeight: "normal",
								fontSize: "0.9em",
								fontStyle: "italic",
								padding: "0.5em",
							}}>
							Aggiungi tag
						</span> */}
						<input
							name="tag"
							value={tag}
							onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
								setTag(e.target.value);
							}}
						/>
						<button style={{ margin: "auto 0.5em" }} onClick={addTag}>
							Add Tag
						</button>
					</label>
					<div className="tags-container">
						{note &&
							note.tags &&
							note.tags.map((tag) => (
								<div className="tag-box">
									{tag}
									<button
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
				<button style={{ backgroundColor: "#ffff00" }} onClick={handleUpdate}>
					UpdateNote
				</button>
			</div>

			{message && <div>{message}</div>}
		</>
	);
}
