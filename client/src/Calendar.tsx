import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ResponseBody } from "./types/ResponseBody";
import "bootstrap/dist/css/bootstrap.min.css";

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
	const [dateMessage, setDateMessage] = React.useState(""); // Nuovo stato per la data

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

	function handleDateClick(e: React.MouseEvent<HTMLTimeElement>): void {
		e.preventDefault();
		const date = e.currentTarget.textContent;
		if (date) {
			setDateMessage(`${date} March 2024`);
		}
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
			{dateMessage && <div className="nome-data">{dateMessage}</div>}{" "}
			{/* Mostra il messaggio della data */}
			{createEvent && (
				<div className="create-event-container">
					<button
						className="btn btn-primary"
						style={{ backgroundColor: "#b30000", color: "#FFFFFF", border: "0" }}
						onClick={toggleCreateEvent}>
						Close
					</button>
					<form>
						<label htmlFor="title">
							Title
							<input
								className="btn border"
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
									className="btn border"
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
									className="btn border"
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
									className="btn border"
									type="text"
									name="location"
									value={location}
									onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
										setLocation(e.target.value)
									}
								/>
							</div>
						</label>
						<button
							className="btn btn-primary"
							style={{ backgroundColor: "#b30000", color: "#FFFFFF", border: "0" }}
							onClick={handleCreateEvent}>
							Crea
						</button>
					</form>
				</div>
			)}
			<div>
				<button
					className="btn btn-primary addEvent"
					style={{ backgroundColor: "#b30000", color: "#FFFFFF", border: "0" }}
					onClick={toggleCreateEvent}>
					+
				</button>
			</div>
			<div className="calendar-container">
				<div className="calendar">
					<div className="month-indicator">
						<time dateTime="2024-03"> March 2024 </time>
					</div>
					<div className="day-of-week">
						<div>Su</div>
						<div>Mo</div>
						<div>Tu</div>
						<div>We</div>
						<div>Th</div>
						<div>Fr</div>
						<div>Sa</div>
					</div>
					<div className="date-grid">
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-01">
								1
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-02">
								2
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-03">
								3
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-04">
								4
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-05">
								5
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-06">
								6
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-07">
								7
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-08">
								8
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-09">
								9
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-10">
								10
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-11">
								11
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-12">
								12
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-13">
								13
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-14">
								14
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-15">
								15
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-16">
								16
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-17">
								17
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-18">
								18
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-19">
								19
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-20">
								20
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-21">
								21
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-22">
								22
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-23">
								23
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-24">
								24
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-25">
								25
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-26">
								26
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-27">
								27
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-28">
								28
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-29">
								29
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-30">
								30
							</time>
						</button>
						<button>
							<time onClick={handleDateClick} dateTime="2024-03-31">
								31
							</time>
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
