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

	return (
		<div>
			<div>
				<input name="title" value={note.title} onChange={handleChange} />
				<textarea name="text" value={note.text} onChange={handleChange} />
				{note && note.tags && note.tags.map((tag) => <div>{tag}</div>)}
				<input
					name="tag"
					value={tag}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
						setTag(e.target.value);
					}}
				/>
				<button
					onClick={(e): void => {
						e.preventDefault();
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
					}}>
					Add Tag
				</button>
			</div>
			<button onClick={handleUpdate}>UpdateNote</button>
			{message && <div>{message}</div>}
		</div>
	);
}
