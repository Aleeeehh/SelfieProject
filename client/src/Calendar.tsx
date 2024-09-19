import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ResponseBody } from "./types/ResponseBody";

enum Frequency {
	ONCE = "once",
	DAILY = "day",
	WEEKLY = "week",
}

export type Event = {
	title: string;
	startDate: Date;
	endDate: Date;
	frequency: Frequency;
	location: string;
};

export default function Calendar(): React.JSX.Element {
	const [title, setTitle] = React.useState("");
	const [createEvent, setCreateEvent] = React.useState(false);
	const [startDate, setStartDate] = React.useState(new Date());
	const [endDate, setEndDate] = React.useState(new Date());
	const [location, setLocation] = React.useState("");

	const [message, setMessage] = React.useState("");

	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch("http://localhost:3002/api/events");
				console.log(res);
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	// Toggle create event screen
	function toggleCreateEvent(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setCreateEvent(!createEvent);
	}

	async function handleCreateEvent(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// TODO: validate input
		const res = await fetch("http://localhost:3002/api/events", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title,
				startDate,
				endDate,
				frequency: Frequency.ONCE,
				location,
			}),
		});

		const data: ResponseBody = (await res.json()) as ResponseBody;

		setMessage(data.message || "Undefined error");

		// TODO: send post request to server

		// TODO: handle response
	}

	return (
		<>
			{message && <div>{message}</div>}
			{createEvent && (
				<div className="create-event-container">
					<button onClick={toggleCreateEvent}>Close</button>
					<form>
						<label htmlFor="title">
							Title
							<input
								type="text"
								name="title"
								value={title}
								onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
									setTitle(e.target.value)
								}
							/>
						</label>
						<label htmlFor="startDate">
							Data Inizio
							<div>
								<DatePicker
									name="startDate"
									selected={startDate}
									onChange={(date: Date | null): void => {
										date && setStartDate(date);
									}}
								/>
							</div>
						</label>
						<label htmlFor="endDate">
							Data Fine
							<div>
								<DatePicker
									name="endDate"
									selected={endDate}
									onChange={(date: Date | null): void => {
										date && setEndDate(date);
									}}
								/>
							</div>
						</label>
						<label htmlFor="location">
							Luogo
							<div>
								<input
									type="text"
									name="location"
									value={location}
									onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
										setLocation(e.target.value)
									}
								/>
							</div>
						</label>
						<button onClick={handleCreateEvent}>Crea</button>
					</form>
				</div>
			)}
			<div className="calendar-container">
				<div>
					<button onClick={toggleCreateEvent}>Add Event</button>
				</div>
				<div className="calendar">Qui ci va il calendario che mostra gli eventi</div>
			</div>
		</>
	);
}
