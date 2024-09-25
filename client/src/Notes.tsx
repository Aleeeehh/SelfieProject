import React from "react";
import { SERVER_API } from "./params/params";
import Note from "./types/Note";
import { ResponseStatus } from "./types/ResponseStatus";
import { ResponseBody } from "./types/ResponseBody";

export default function Notes(): React.JSX.Element {
	const [noteList, setNoteList] = React.useState([] as Note[]);
	const [message, setMessage] = React.useState("");

	// On page load, get the notes for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/notes`);
				if (res.status !== 200) {
					throw Error();
				}
				const resBody = (await res.json()) as ResponseBody;

				if (resBody.status === ResponseStatus.GOOD) {
					setNoteList(resBody.value);
					console.log(resBody.value);
				} else {
					setMessage("Note non trovate");
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	return (
		<div className="note-outer-container">
			<a href={"/notes/new"}>
				<button>Create New Note</button>
			</a>
			<div className="note-list-container">
				{noteList.map((note) => (
					<a className="note-card" href={`/notes/${note.id}`}>
						<div>
							<div className="note-card-title">{note.title}</div>
							<div className="note-card-text">
								{note.text.length > 100
									? note.text.substring(0, 100) + "..."
									: note.text}
							</div>
						</div>
						<div className="note-card-date">
							Last update: {note.updatedAt?.toString()}
						</div>
					</a>
				))}
			</div>
			{message && <div>{message}</div>}
		</div>
	);
}
