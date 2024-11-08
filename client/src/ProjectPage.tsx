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

import DatePicker from "react-datepicker";
import { AdvancementType } from "./types/Activity";

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

const baseActivity: Activity = {
	id: "",
	title: "",
	description: "",
	deadline: new Date(),
	owner: "",
	accessList: [] as string[],
	completed: false,
	start: new Date(),
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

interface ActivityCreateFormProps {
	onCreationSuccess: () => void;
	onCreationFail: () => void;
	projectId?: string;
}

export function ActivityCreateForm({
	onCreationFail,
	onCreationSuccess,
	projectId,
}: ActivityCreateFormProps): React.JSX.Element {
	// const { loggedUser } = useAuth();
	const [addNotification, setAddNotification] = React.useState(false);

	const [activity, setActivity] = React.useState<Activity>(baseActivity);
	const [siblingActivities, setSiblingActivities] = React.useState<Activity[]>([]);

	const [notificationTime, setNotificationTime] = React.useState(0);
	const [notificationRepeat, setNotificationRepeat] = React.useState(false);
	const [_, setNotificationRepeatTime] = React.useState(0);

	React.useEffect(() => {
		if (projectId) {
			setSiblingActivities(getActivitiesForProject(projectId));
		} else {
			console.log(
				"Project id not inserted. This is a normal activity, not related to a project."
			);
		}
	}, []);

	const getValidRepeatOptions = (time: number): number[] => {
		const options = [0, 5, 10, 15, 30, 60, 120, 1440]; // Opzioni disponibili
		return options.filter((option) => option !== time && (time % option === 0 || option === 0)); // Filtra solo i divisori, escludendo il numero stesso
	};

	async function handleCreateActivity(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// create the new activity here (inside the component)

		const res = await fetch(`${SERVER_API}/activity`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...activity }),
		});

		// received action post activity creation handle
		if (res.status === 200) onCreationSuccess();
		else onCreationFail();
	}

	function getActivitiesForProject(id: string): Activity[] {
		if (!id) return [];

		fetch(`${SERVER_API}/projects/${id}/activities`)
			.then((res) => res.json())
			.then((data) => {
				return data.value as Activity[];
			})
			.catch((e) => {
				console.log(e);
				console.log("Errore nel ritrovamenteo delle attività");
				return [];
			});

		return [];
	}

	return (
		<form>
			<label htmlFor="title">
				Title
				<input
					className="btn border"
					type="text"
					name="title"
					value={activity.title}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
						setActivity({ ...activity, title: e.target.value })
					}
				/>
			</label>
			<label htmlFor="description">
				Descrizione
				<input
					className="btn border"
					type="text"
					name="title"
					value={activity.description}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
						setActivity({ ...activity, description: e.target.value })
					}
				/>
			</label>
			<label htmlFor="endTime">
				Scadenza
				<div>
					<DatePicker
						className="btn border"
						name="endTime"
						selected={activity.deadline}
						onChange={(date: Date | null): void => {
							if (date) {
								// Aggiorna la data mantenendo l'orario attuale
								const newDate = new Date(activity.deadline);
								newDate.setFullYear(
									date.getFullYear(),
									date.getMonth(),
									date.getDate()
								);
								setActivity({ ...activity, deadline: newDate });
							}
						}}
					/>
				</div>
				<div>
					<input
						className="btn border"
						type="time"
						value={`${activity.deadline
							.getHours()
							.toString()
							.padStart(2, "0")}:${activity.deadline
							.getMinutes()
							.toString()
							.padStart(2, "0")}`}
						onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
							const [hours, minutes] = e.target.value.split(":");
							const newDate = new Date(activity.deadline);
							newDate.setHours(Number(hours), Number(minutes)); // Aggiorna l'orario
							setActivity({ ...activity, deadline: newDate });
						}}
					/>
				</div>
			</label>

			<label htmlFor="allDayEvent">
				<input
					type="checkbox"
					name="addNotification"
					onClick={(): void => setAddNotification(!addNotification)}
					style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
				/>
				Aggiungi notifica
			</label>

			{addNotification && (
				<label htmlFor="notificationTime">
					Quanto tempo prima mandare la notifica
					<select
						id="notificationTimeSelect"
						className="btn border"
						onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
							setNotificationTime(Number(e.target.value));
							if (Number(e.target.value) > 0) {
								setNotificationRepeat(true); // Imposta il valore selezionato come notificationTime
							} else if (Number(e.target.value) === 0) {
								setNotificationRepeat(false);
							}
						}}
						style={{ marginLeft: "10px" }} // Aggiungi margine se necessario
					>
						<option value="0">All'ora d'inizio</option>
						<option value="5">5 minuti prima</option>
						<option value="10">10 minuti prima</option>
						<option value="15">15 minuti prima</option>
						<option value="30">30 minuti prima</option>
						<option value="60">1 ora prima</option>
						<option value="120">2 ore prima</option>
						<option value="1440">Un giorno prima</option>
						<option value="2880">2 giorni prima</option>
					</select>
				</label>
			)}

			{notificationRepeat && (
				<label htmlFor="notificationRepeatTime">
					Quanto tempo ripetere la notifica
					<select
						className="btn border"
						name="notificationRepeatTime"
						onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
							setNotificationRepeatTime(Number(e.target.value));
						}}>
						{getValidRepeatOptions(notificationTime).map((option) => (
							<option key={option} value={option}>
								{option === 0
									? "Mai"
									: option >= 60
									? `Ogni ${option / 60} ore` // Se option è maggiore di 60, mostra in ore
									: `Ogni ${option} minuti`}
							</option>
						))}
					</select>
				</label>
			)}
			{projectId && (
				<div>
					{
						// activity.parent = parent;
						// activity.prev = prev;
						// activity.next = prev;
					}
					<label htmlFor="start">
						Data di inizio
						<div>
							<DatePicker
								className="btn border"
								name="start"
								selected={activity.start}
								onChange={(date: Date | null): void => {
									if (date) {
										// Aggiorna la data mantenendo l'orario attuale
										const newDate = new Date(activity.start || "");
										newDate.setFullYear(
											date.getFullYear(),
											date.getMonth(),
											date.getDate()
										);
										setActivity({ ...activity, start: newDate });
									}
								}}
							/>
						</div>
						<div>
							<input
								className="btn border"
								type="time"
								value={
									activity.start
										? `${activity.start
												.getHours()
												.toString()
												.padStart(2, "0")}:${activity.start
												.getMinutes()
												.toString()
												.padStart(2, "0")}`
										: new Date(Date.now())
												.getHours()
												.toString()
												.padStart(2, "0") +
										  ":" +
										  new Date(Date.now())
												.getMinutes()
												.toString()
												.padStart(2, "0")
								}
								onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
									const [hours, minutes] = e.target.value.split(":");
									const newDate = new Date(activity.start || "");
									newDate.setHours(Number(hours), Number(minutes)); // Aggiorna l'orario
									setActivity({ ...activity, start: newDate });
								}}
							/>
						</div>
					</label>
					<label htmlFor="milestone">
						Milestone:
						<input
							type="checkbox"
							name="milestone"
							checked={activity.milestone || false}
							onClick={(): void => {
								setActivity({ ...activity, milestone: !activity.milestone });
							}}
						/>
					</label>
					<label htmlFor="advancementType">
						<select
							className="btn border"
							name="advancementType"
							onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
								setActivity({
									...activity,
									advancementType: e.target.value as AdvancementType,
								});
							}}>
							<option
								key={AdvancementType.CONTRACTION}
								value={AdvancementType.CONTRACTION}
							/>
							<option
								key={AdvancementType.TRANSLATION}
								value={AdvancementType.TRANSLATION}
							/>
						</select>
					</label>
					<label htmlFor="parent">
						<select
							className="btn border"
							name="parent"
							onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
								setActivity({
									...activity,
									parent: e.target.value,
								});
							}}>
							{siblingActivities.map((act) => (
								<option key={act.title} value={act.id} />
							))}
						</select>
					</label>
					<label htmlFor="prev">
						<select
							className="btn border"
							name="prev"
							onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
								setActivity({
									...activity,
									prev: e.target.value,
								});
							}}>
							{siblingActivities.map((act) => (
								<option key={act.title} value={act.id} />
							))}
						</select>
					</label>
					<label htmlFor="next">
						<select
							className="btn border"
							name="next"
							onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
								setActivity({
									...activity,
									next: e.target.value,
								});
							}}>
							{siblingActivities.map((act) => (
								<option key={act.title} value={act.id} />
							))}
						</select>
					</label>
				</div>
			)}
			<button
				className="btn btn-primary"
				style={{
					backgroundColor: "bisque",
					color: "white",
					border: "0",
				}}
				onClick={handleCreateActivity}>
				Create Activity
			</button>
		</form>
	);
}
export default function ProjectPage(): React.JSX.Element {
	const { id } = useParams();
	const [project, setProject] = React.useState(baseProject);
	const [message, setMessage] = React.useState("");
	const [isEditing, setIsEditing] = React.useState(id === NEW);
	// const [isPreview, setIsPreview] = React.useState(false);

	const [isCreatingActivity, setIsCreatingActivity] = React.useState(false);

	const nav = useNavigate();

	async function updateProject(): Promise<void> {
		if (id !== NEW)
			fetch(`${SERVER_API}/projects/${id}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.status === ResponseStatus.GOOD) {
						setProject(data.value as Project);
						console.log(data.value);
					} else {
						console.log(data.message || "Errore nel caricamento del progetto");
						// nav("/projects");
					}
				})
				.catch(() => {
					setMessage("Impossibile raggiungere il server");
					// nav("/projects");
				});
	}
	// On page load, get the note for the user
	React.useEffect(() => {
		updateProject();
	}, []);

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setProject({ ...project, [e.target.name]: e.target.value });
	}

	/*function handlePrivacyChange(e: React.ChangeEvent<HTMLSelectElement>): void {
		setNote({ ...note, privacy: e.target.value as Privacy });
	}*/

	async function handleCreateProject(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		try {
			const res = await fetch(`${SERVER_API}/projects`, {
				method: "POST",
				body: JSON.stringify({
					title: project.title,
					description: project.description,
					accessList: project.accessList,
				}),
				headers: { "Content-Type": "application/json" },
			});

			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				const newNoteId: string = resBody.value;
				alert("Progetto creato correttamente!");

				// redirect to update page of the created note
				nav(`/projects/${newNoteId}`);
			} else {
				setMessage(resBody.message || "Errore nel caricamento del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	/*async function handleCreateActivity(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		try {
			const res = await fetch(`${SERVER_API}/activities`, {
				method: "POST",
				body: JSON.stringify(newActivity),
				headers: { "Content-Type": "application/json" },
			});

			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				const newNoteId: string = resBody.value;
				alert("Progetto creato correttamente!");

				// redirect to update page of the created note
				nav(`/projects/${newNoteId}`);
			} else {
				setMessage(resBody.message || "Errore nel caricamento del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}*/

	async function handleUpdateProject(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// TODO: validate inputs (not empty, max length)
		try {
			const res = await fetch(`${SERVER_API}/projects/${id}`, {
				method: "PUT",
				body: JSON.stringify(project),
				headers: { "Content-Type": "application/json" },
			});

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				alert("Nota modificata correttamente!");

				await updateProject();

				console.log(resBody.value as Note);
			} else {
				setMessage(resBody.message || "Errore nell'aggiornamento del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	async function handleDeleteProject(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// TODO: validate inputs (not empty, max length)
		try {
			const res = await fetch(`${SERVER_API}/projects/${id}`, {
				method: "DELETE",
			});

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				alert("Progetto cancellato correttamente!");
				nav("/projects");
			} else {
				setMessage(resBody.message || "Errore della cancellazione del progetto");
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
	}*/

	async function handleDeleteActivity(
		e: React.MouseEvent<HTMLButtonElement>,
		id: string | undefined
	): Promise<void> {
		e.preventDefault();

		if (!id) {
			console.log("Id non trovato per l'attività, impossibile eliminare");
			setMessage("Id non trovato per l'attività, impossibile eliminare");
			return;
		}

		try {
			const res = await fetch(`${SERVER_API}/activity/${id}`, {
				method: "DELETE",
			});

			console.log(res);
			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				alert("Attività cancellata correttamente!");

				await updateProject();
			} else {
				setMessage(resBody.message || "Errore della cancellazione del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	/*function deleteTag(e: React.MouseEvent<HTMLElement>, tag: string): void {
		e.preventDefault();
		const tags = note.tags.filter((t) => t !== tag);

		setNote({ ...note, tags });
	}*/

	function toggleEdit(e: React.MouseEvent<HTMLButtonElement>): void {
		if (isEditing) {
			handleUpdateProject(e);
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

	function deleteUser(e: React.MouseEvent<HTMLElement>, username: string): void {
		e.preventDefault();

		setProject((prevProj) => {
			return {
				...prevProj,
				accessList: prevProj.accessList.filter((u) => u !== username),
			};
		});
	}

	/*function handleAddItem(e: React.MouseEvent<HTMLButtonElement>): void {
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
								<div>
									<div>{u}</div>
									<button
										onClick={(e: React.MouseEvent<HTMLButtonElement>): void =>
											deleteUser(e, u)
										}>
										Elimina
									</button>
								</div>
							))}
						</div>
					</div>

					{/* render activity list */}
					<div>
						{project.activityList &&
							project.activityList.map((a) => (
								<div key={"activity-" + a.id}>
									<div>{a.title}</div>
									<a href={`/activity/${a.id}`}>
										<button>Modifica</button>
									</a>

									<button
										onClick={async (
											e: React.MouseEvent<HTMLButtonElement>
										): Promise<void> => await handleDeleteActivity(e, a.id)}>
										Elimina
									</button>
								</div>
							))}
						{!isCreatingActivity ? (
							<button
								onClick={(): void => {
									setIsCreatingActivity(true);
								}}>
								Crea Attività
							</button>
						) : (
							<div>
								<ActivityCreateForm
									projectId={project.id}
									onCreationSuccess={async (): Promise<void> => {
										setIsCreatingActivity(false);
										alert("Attività creata con successo");
										await updateProject();
									}}
									onCreationFail={(): void => {
										setMessage("Errore nel creare attività");
									}}
								/>
								<button
									onClick={(): void => {
										setIsCreatingActivity(false);
									}}>
									Annulla
								</button>
							</div>
						)}
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

					{id !== NEW && (
						<button onClick={toggleEdit}>
							{isEditing ? "Salva modifiche" : "Modifica progetto"}
						</button>
					)}
					{isEditing && (
						<button
							style={{ backgroundColor: "blue" }}
							onClick={id === NEW ? handleCreateProject : handleUpdateProject}>
							{id === NEW ? "Crea Progetto" : "Aggiorna progetto"}
						</button>
					)}
					{id !== NEW && !isEditing && (
						<button style={{ backgroundColor: "red" }} onClick={handleDeleteProject}>
							Cancella Progetto
						</button>
					)}
				</div>
			</div>

			{message && <div>{message}</div>}
		</>
	);
}
