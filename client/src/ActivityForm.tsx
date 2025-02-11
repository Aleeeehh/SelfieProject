import DatePicker from "react-datepicker";
import Activity, { AdvancementType } from "./types/Activity";
import React from "react";
import { SERVER_API } from "./lib/params";

const baseActivity: Activity = {
	id: "",
	title: "",
	description: "",
	deadline: new Date(),
	owner: "",
	accessList: [] as string[],
	completed: false,
};

interface ActivityCreateFormProps {
	onSuccess: () => void;
	onFail: () => void;
	projectId?: string;
	inputActivity?: Activity;
	siblings?: { id: string | undefined; title: string }[];
}

export default function ActivityForm({
	onFail,
	onSuccess,
	projectId,
	inputActivity,
	siblings,
}: ActivityCreateFormProps): React.JSX.Element {
	const [addNotification, setAddNotification] = React.useState(false);

	const [activity, setActivity] = React.useState<Activity>(
		inputActivity
			? {
				...inputActivity,
				deadline: new Date(inputActivity.deadline),
			}
			: baseActivity
	);

	const [notificationTime, setNotificationTime] = React.useState(0);
	const [notificationRepeat, setNotificationRepeat] = React.useState(false);
	const [_, setNotificationRepeatTime] = React.useState(0);

	const getValidRepeatOptions = (time: number): number[] => {
		const options = [0, 5, 10, 15, 30, 60, 120, 1440];
		return options.filter((option) => option !== time && (time % option === 0 || option === 0));
	};

	async function handleCreateActivity(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		console.log("Creating activity: ", JSON.stringify(activity));

		for (const user of activity.accessList) {
			console.log("utente nell'accessList: ", user);
		}

		const res = await fetch(`${SERVER_API}/activities`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: activity.title,
				description: activity.description,
				accessList: activity.accessList,
				deadline: activity.deadline.toISOString().split("T")[0],
				idEventoNotificaCondiviso: activity.idEventoNotificaCondiviso,
				projectId: projectId,
				milestone: activity.milestone,
				parent: activity.parent,
				prev: activity.prev,
				next: activity.next,
				advancementType: activity.advancementType,
			}),
		});

		if (res.status === 200) onSuccess();
		else onFail();
	}

	async function handleUpdateActivity(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		console.log("Updating activity: ", JSON.stringify(activity));

		const res = await fetch(`${SERVER_API}/activities/${activity.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: activity.title,
				description: activity.description,
				accessList: activity.accessList,
				deadline: activity.deadline.toISOString().split("T")[0],
				idEventoNotificaCondiviso: activity.idEventoNotificaCondiviso,
				projectId: projectId,
				milestone: activity.milestone,
				parent: activity.parent,
				prev: activity.prev,
				next: activity.next,
				advancementType: activity.advancementType,
			}),
		});

		if (res.status === 200) onSuccess();
		else onFail();
	}

	return (
		<form className="activity-vertical">
			<label htmlFor="title" className="activity-vertical">
				Titolo
				<input
					style={{ backgroundColor: "white" }}
					className="btn border"
					type="text"
					name="title"
					value={activity.title}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
						setActivity({ ...activity, title: e.target.value })
					}
				/>
			</label>
			<label htmlFor="description" className="activity-vertical">
				Descrizione
				<input
					style={{ backgroundColor: "white" }}
					className="btn border"
					type="text"
					name="title"
					value={activity.description}
					onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
						setActivity({ ...activity, description: e.target.value })
					}
				/>
			</label>
			<label htmlFor="endTime" className="activity-vertical">
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
						style={{ backgroundColor: "white" }}
						className="btn border"
						type="time"
						value={`${new Date(activity.deadline)
							.getHours()
							.toString()
							.padStart(2, "0")}:${new Date(activity.deadline)
								.getMinutes()
								.toString()
								.padStart(2, "0")}`}
						onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
							const [hours, minutes] = e.target.value.split(":");
							const newDate = new Date(activity.deadline);
							newDate.setHours(Number(hours), Number(minutes));
							setActivity({ ...activity, deadline: newDate });
						}}
					/>
				</div>
			</label>

			<label htmlFor="addNotification">
				Aggiungi notifica
				<input
					type="checkbox"
					id="addNotification"
					name="addNotification"
					onClick={(): void => setAddNotification(!addNotification)}
					style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
				/>
			</label>

			{addNotification && (
				<label htmlFor="notificationTime" className="activity-vertical">
					Quanto tempo prima mandare la notifica
					<select
						id="notificationTimeSelect"
						className="btn border"
						onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
							setNotificationTime(Number(e.target.value));
							if (Number(e.target.value) > 0) {
								setNotificationRepeat(true);
							} else if (Number(e.target.value) === 0) {
								setNotificationRepeat(false);
							}
						}}
						style={{ backgroundColor: "white" }}
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
				<label htmlFor="notificationRepeatTime" className="activity-vertical">
					Ripetizioni notifica
					<select
						style={{ backgroundColor: "white" }}
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
										? `Ogni ${option / 60} ore`
										: `Ogni ${option} minuti`}
							</option>
						))}
					</select>
				</label>
			)}
			
			{/* Leo - Progetti - START*/}
			{projectId && (
				<div>
					<label htmlFor="milestone">
						Milestone:
						<input
							style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
							type="checkbox"
							name="milestone"
							id="milestone"
							checked={activity.milestone || false}
							onClick={(): void => {
								setActivity({ ...activity, milestone: !activity.milestone });
							}}
						/>
					</label>
					<label htmlFor="advancementType" className="activity-vertical">
						<select
							style={{ backgroundColor: "white" }}
							className="btn border"
							name="advancementType"
							onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
								setActivity({
									...activity,
									advancementType: e.target.value as AdvancementType,
								});
							}}
							value={activity.advancementType || undefined}>
							<option
								key={AdvancementType.TRANSLATION}
								value={AdvancementType.TRANSLATION}>
								{AdvancementType.TRANSLATION}
							</option>
							<option
								key={AdvancementType.CONTRACTION}
								value={AdvancementType.CONTRACTION}>
								{AdvancementType.CONTRACTION}
							</option>
						</select>
					</label>

					{/* Parent cannot be changed once is */}
					<label htmlFor="parent" className="activity-vertical">
						{inputActivity ? (
							<select
								style={{ backgroundColor: "white" }}
								className="btn border"
								name="parent"
								onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
									setActivity({
										...activity,
										parent: e.target.value,
									});
								}}>
								{siblings &&
									siblings.map((act) => (
										<option key={act.title} value={act.id}>
											{act.title}
										</option>
									))}
							</select>
						) : (
							<div>{activity.parent}</div>
						)}
					</label>
					<label htmlFor="next" className="activity-vertical">
						<select
							style={{ backgroundColor: "white" }}
							className="btn border"
							name="next"
							onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
								setActivity({
									...activity,
									next: e.target.value,
								});
							}}>
							{siblings &&
								siblings.map((act) => (
									<option key={act.title} value={act.id}>
										{act.title}
									</option>
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
