import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ResponseBody } from "./types/ResponseBody";
import "bootstrap/dist/css/bootstrap.min.css";
import { SERVER_API } from "./params/params";

enum Frequency {
	ONCE = "once",
	DAILY = "day",
	WEEKLY = "week",
}

const Mesi = [
	"Gennaio",
	"Febbraio",
	"Marzo",
	"Aprile",
	"Maggio",
	"Giugno",
	"Luglio",
	"Agosto",
	"Settembre",
	"Ottobre",
	"Novembre",
	"Dicembre",
];
//const GiorniSettimana = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

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
	const [meseCorrente, setMeseCorrente] = React.useState(0); //inizializzazione mese corrente a zero
	const [message, setMessage] = React.useState("");
	const [day, setDay] = React.useState(1);
	//const [dayWeek, setDayWeek] = React.useState(0);

	function mesePrecedente(): void {
		setMeseCorrente((meseCorrente - 1 + Mesi.length) % Mesi.length);
	}

	function meseSuccessivo(): void {
		setMeseCorrente((meseCorrente + 1) % Mesi.length);
	}

	// On page load, get the events for the user
	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/events`);
				console.log(res);
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
	}, []);

	// Toggle create event screen

	//da implementare
	//function changeDayWeek(day: number): void {}

	function toggleCreateEvent(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setCreateEvent(!createEvent);
	}

	function handleDateClick(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		const dayValue = Number(e.currentTarget.textContent);
		console.log("Clicked day:", dayValue); // Log per il debug
		setDay(dayValue);
		//changeDayWeek(dayValue);
	}

	async function handleCreateEvent(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		// TODO: validate input
		const res = await fetch(`${SERVER_API}/events`, {
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
		setCreateEvent(!createEvent);

		// TODO: send post request to server
		// TODO: handle response
	}

	return (
		<>
			{message && <div>{message}</div>}
			{day && (
				<div className="nome-data">
					{day} {Mesi[meseCorrente]} 2024
				</div>
			)}

			<div className="calendar-container row">
				<div className="calendar col-4">
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							marginRight: "5vw",
						}}>
						<button
							className="btn addEvent"
							style={{
								backgroundColor: "bisque",
								color: "white",
								border: "0",
								minWidth: "100px",
								fontSize: "1rem",
							}}
							onClick={toggleCreateEvent}>
							Add Event
						</button>
					</div>
					<div
						className="month-indicator"
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}>
						<button
							className="btn btn-primary"
							style={{
								backgroundColor: "bisque",
								color: "white",
								border: "0",
								minWidth: "100px",
								fontSize: "1rem",
							}}
							onClick={mesePrecedente}>
							Back
						</button>
						<time style={{ fontSize: "2rem", color: "black" }}>
							{" "}
							{Mesi[meseCorrente]}
						</time>
						<button
							className="btn btn-primary"
							style={{
								backgroundColor: "bisque",
								color: "white",
								border: "0",
								minWidth: "100px",
								fontSize: "1rem",
							}}
							onClick={meseSuccessivo}>
							Next
						</button>
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
						<button onClick={handleDateClick}>1</button>
						<button onClick={handleDateClick}>2</button>
						<button onClick={handleDateClick}>3</button>
						<button onClick={handleDateClick}>4</button>
						<button onClick={handleDateClick}>5</button>
						<button onClick={handleDateClick}>6</button>
						<button onClick={handleDateClick}>7</button>
						<button onClick={handleDateClick}>8</button>
						<button onClick={handleDateClick}>9</button>
						<button onClick={handleDateClick}>10</button>
						<button onClick={handleDateClick}>11</button>
						<button onClick={handleDateClick}>12</button>
						<button onClick={handleDateClick}>13</button>
						<button onClick={handleDateClick}>14</button>
						<button onClick={handleDateClick}>15</button>
						<button onClick={handleDateClick}>16</button>
						<button onClick={handleDateClick}>17</button>
						<button onClick={handleDateClick}>18</button>
						<button onClick={handleDateClick}>19</button>
						<button onClick={handleDateClick}>20</button>
						<button onClick={handleDateClick}>21</button>
						<button onClick={handleDateClick}>22</button>
						<button onClick={handleDateClick}>23</button>
						<button onClick={handleDateClick}>24</button>
						<button onClick={handleDateClick}>25</button>
						<button onClick={handleDateClick}>26</button>
						<button onClick={handleDateClick}>27</button>
						<button onClick={handleDateClick}>28</button>
						<button onClick={handleDateClick}>29</button>
						<button onClick={handleDateClick}>30</button>
						<button onClick={handleDateClick}>31</button>
					</div>
				</div>
				{createEvent && (
					<div className="create-event-container col-2">
						<button
							className="btn btn-primary"
							style={{ backgroundColor: "bisque", color: "white", border: "0" }}
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
								style={{ backgroundColor: "bisque", color: "white", border: "0" }}
								onClick={handleCreateEvent}>
								Create Event
							</button>
						</form>
					</div>
				)}
				<div className="orario col-5">
					<time>00:00</time>
					<time>01:00</time>
					<time>02:00</time>
					<time>03:00</time>
					<time>04:00</time>
					<time>05:00</time>
					<time>06:00</time>
					<time>07:00</time>
					<time>08:00</time>
					<time>09:00</time>
					<time>10:00</time>
					<time>11:00</time>
					<time>12:00</time>
					<time>13:00</time>
					<time>14:00</time>
					<time>15:00</time>
					<time>16:00</time>
					<time>17:00</time>
					<time>18:00</time>
					<time>19:00</time>
					<time>20:00</time>
					<time>21:00</time>
					<time>22:00</time>
					<time>23:00</time>
					<time>00:00</time>
				</div>
			</div>
		</>
	);
}
