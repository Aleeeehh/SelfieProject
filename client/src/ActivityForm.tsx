import DatePicker from "react-datepicker";
import Activity, { AdvancementType } from "./types/Activity";
import React from "react";
import { SERVER_API } from "./params/params";

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

interface ActivityCreateFormProps {
	onSuccess: () => void;
	onFail: () => void;
	projectId?: string;
	inputActivity?: Activity;
}

export default function ActivityForm({
	onFail,
	onSuccess,
	projectId,
	inputActivity,
}: ActivityCreateFormProps): React.JSX.Element {
	// const { loggedUser } = useAuth();
	const [addNotification, setAddNotification] = React.useState(false);

	const [activity, setActivity] = React.useState<Activity>(inputActivity || baseActivity);
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
		console.log("Creating activity");

		const res = await fetch(`${SERVER_API}/activity`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: activity.title,
				description: activity.description,
				accessList: activity.accessList,
				deadline: activity.deadline,
				idEventoNotificaCondiviso: activity.idEventoNotificaCondiviso,
				projectId: projectId,
				start: activity.start?.toISOString().split("T")[0],
				milestone: activity.milestone,
				parent: activity.parent,
				prev: activity.prev,
				next: activity.next,
			}),
		});

		// received action post activity creation handle
		if (res.status === 200) onSuccess();
		else onFail();
	}

	async function handleUpdateActivity(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		console.log("Updating activity: " + activity.id);

		// update the activity here (inside the component)

		const res = await fetch(`${SERVER_API}/activity`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(activity),
		});

		// received action post activity update handle
		if (res.status === 200) onSuccess();
		else onFail();
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
		<form style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
			<label htmlFor="title" style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
				Titolo
				<input
					style={{backgroundColor: "white"}}
					className="btn border"
					type="text"
					name="title"
					value={activity.title}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
						setActivity({ ...activity, title: e.target.value })
					}
				/>
			</label>
			<label htmlFor="description" style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
				Descrizione
				<input
					style={{backgroundColor: "white"}}
					className="btn border"
					type="text"
					name="title"
					value={activity.description}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
						setActivity({ ...activity, description: e.target.value })
					}
				/>
			</label>
			<label htmlFor="endTime" style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
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
						style={{backgroundColor: "white"}}
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
				Aggiungi notifica
				<input
					type="checkbox"
					name="addNotification"
					onClick={(): void => setAddNotification(!addNotification)}
					style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
				/>
			</label>

			{addNotification && (
				<label htmlFor="notificationTime" style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
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
						style={{ backgroundColor: "white" }} // Aggiungi margine se necessario
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
				<label htmlFor="notificationRepeatTime" style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
					Ripetizioni notifica
					<select
						style={{backgroundColor: "white"}}
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
			{/* Leo - Progetti - START*/}
			{projectId && (
				<div>
					{
						// activity.parent = parent;
						// activity.prev = prev;
						// activity.next = prev;
					}
					<label htmlFor="start" style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
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
								style={{backgroundColor: "white"}}
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
							style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
							type="checkbox"
							name="milestone"
							checked={activity.milestone || false}
							onClick={(): void => {
								setActivity({ ...activity, milestone: !activity.milestone });
							}}
						/>
					</label>
					<label htmlFor="advancementType" style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
						<select
							style={{backgroundColor: "white"}}
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
					<label htmlFor="parent" style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
						<select
							style={{backgroundColor: "white"}}
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
					<label htmlFor="prev" style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
						<select
							style={{backgroundColor: "white"}}
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
					<label htmlFor="next" style={{display: "flex", flexDirection: "column", gap: "0.5em"}}>
						<select
							style={{backgroundColor: "white"}}
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
			{/* Leo - Progetti - END*/}
			<button
				className="btn btn-primary"
				style={{
					backgroundColor: "bisque",
					color: "black",
					border: "0",
				}}
				onClick={inputActivity ? handleUpdateActivity : handleCreateActivity}>
				{inputActivity ? "Aggiorna attività" : "Crea attività"}
			</button>
		</form>
	);
}
