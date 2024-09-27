import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ResponseBody } from "./types/ResponseBody";
import "bootstrap/dist/css/bootstrap.min.css";
import { SERVER_API } from "./params/params";
import { getDaysInMonth, startOfMonth, getDay } from "date-fns"; //funzioni di date-fns

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
//const GiorniSettimana = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

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
	const [meseCorrente, setMeseCorrente] = React.useState(new Date().getMonth()); //inizializzazione mese corrente
	const [message, setMessage] = React.useState("");
	const [day, setDay] = React.useState(new Date().getDate());
	const [activeButton, setActiveButton] = React.useState(0);
	const [year, setYear] = React.useState(2024);
	//const [dayWeek, setDayWeek] = React.useState(0);

	function dayMode(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setActiveButton(0);
		console.log(activeButton);
	}

	function weekMode(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setActiveButton(1);
		console.log(activeButton);
	}

	function monthMode(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		setActiveButton(2);
		console.log(activeButton);
	}

	function nextWeek(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		let newDay = day + 7;
		let newMonth = meseCorrente;
		let newYear = year;

		while (newDay > getDaysInMonth(new Date(newYear, newMonth))) {
			newDay -= getDaysInMonth(new Date(newYear, newMonth));
			newMonth = (newMonth + 1) % 12;
			if (newMonth === 0) {
				newYear += 1;
			}
		}

		setDay(newDay);
		setMeseCorrente(newMonth);
		setYear(newYear);
	}

	function prevWeek(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		let newDay = day - 7;
		let newMonth = meseCorrente;
		let newYear = year;

		while (newDay < 1) {
			newMonth = (newMonth - 1 + 12) % 12;
			if (newMonth === 11) {
				newYear -= 1;
			}
			newDay += getDaysInMonth(new Date(newYear, newMonth));
		}

		setDay(newDay);
		setMeseCorrente(newMonth);
		setYear(newYear);
	}


	function mesePrecedente(): void {
		if (meseCorrente === 0) {
			setMeseCorrente((meseCorrente - 1 + 12) % 12);
			setYear((year - 1));
		} else {
			setMeseCorrente((meseCorrente - 1 + 12) % 12);
		}
	}

	function meseSuccessivo(): void {
		if (meseCorrente === 11) {
			setMeseCorrente((meseCorrente + 1) % 12);
			setYear((year + 1));
		} else {
			setMeseCorrente((meseCorrente + 1) % 12);
		}
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

	function getAdjustedDay(day: number, offset: number, year: number, month: number): number {
		let newDay = day + offset;
		let newMonth = month;
		let newYear = year;

		while (newDay > getDaysInMonth(new Date(newYear, newMonth))) {
			newDay -= getDaysInMonth(new Date(newYear, newMonth));
			newMonth = (newMonth + 1) % 12;
			if (newMonth === 0) {
				newYear += 1;
			}
		}

		while (newDay < 1) {
			newMonth = (newMonth - 1 + 12) % 12;
			if (newMonth === 11) {
				newYear -= 1;
			}
			newDay += getDaysInMonth(new Date(newYear, newMonth));
		}

		return newDay;
	}

	return (
		<>
			{message && <div>{message}</div>}
			{day && (
				<div>
					<div style={{ display: "flex", justifyContent: "center" }}>
						<button
							className="btn btn-primary"
							style={{
								backgroundColor: "bisque",
								color: "white",
								border: "0",
								marginLeft: "15px"
							}}
							onClick={dayMode}>
							Day
						</button>
						<button
							className="btn btn-primary"
							style={{
								backgroundColor: "bisque",
								color: "white",
								border: "0",
								marginLeft: "15px"
							}}
							onClick={weekMode}>
							Week
						</button>
						<button
							className="btn btn-primary"
							style={{
								backgroundColor: "bisque",
								color: "white",
								border: "0",
								marginLeft: "15px"
							}}
							onClick={monthMode}>
							Month
						</button>
					</div>


				</div >
			)
			}

			{activeButton === 0 && <div className="calendar-container row" style={{ marginTop: "2vw" }}>
				<div className="nome-data-container ">
					<div>
						{day} {Mesi[meseCorrente]}{year}
						<button className="year-button " onClick={(): void => setYear(year - 1)}>-</button>
						<button className="year-button" onClick={(): void => setYear(year + 1)}>+</button>
					</div>
				</div>
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
							justifyContent: "center",
							alignItems: "center",
						}}>
						<button
							className="btn btn-primary"
							style={{
								backgroundColor: "bisque", color: "black", border: "0", width: "50px", marginRight: "10px"
							}}
							onClick={(): void => {
								mesePrecedente();/*
								console.log(Mesi[meseCorrente - 1]);
								const date = new Date(year, meseCorrente - 1);
								console.log(getDaysInMonth(date));
								*/
							}}>
							{"<<"}
						</button>
						<time style={{ fontSize: "2rem", color: "black" }}>
							{" "}
							{Mesi[meseCorrente]}
						</time>
						<button
							className="btn btn-primary"
							style={{
								backgroundColor: "bisque", color: "black", border: "0", width: "50px", marginLeft: "10px"
							}}
							onClick={(): void => {
								meseSuccessivo();/*
								console.log(Mesi[meseCorrente + 1]);
								const date = new Date(year, meseCorrente + 1);
								console.log(getDaysInMonth(date));
								*/
							}}>
							{">>"}
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
						{/* Aggiungi spazi vuoti per allineare il primo giorno del mese */}
						{((): JSX.Element[] => {
							return Array.from({
								length: getDay(startOfMonth(new Date(year, meseCorrente)))
							}).map((_, index) => (
								<div key={index}></div>
							));
						})()}
						{/* Genera i bottoni per i giorni del mese */}
						{Array.from({ length: getDaysInMonth(new Date(year, meseCorrente)) }).map((_, day) => (
							<button key={day + 1} onClick={handleDateClick}>{day + 1}</button>
						))}
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
			}

			{activeButton === 1 && <div>
				<div className="nome-data-week" style={{ display: "flex", justifyContent: "center", marginTop: "2vw" }}>
					<button className="btn btn-primary" style={{ backgroundColor: "bisque", color: "black", border: "0", width: "50px", marginRight: "10px" }} onClick={prevWeek}>{"<<"}</button>
					<div>{Mesi[meseCorrente]} {year} </div>
					<button className="btn btn-primary" style={{ backgroundColor: "bisque", color: "black", border: "0", width: "50px", marginLeft: "10px" }} onClick={nextWeek}>{">>"}</button>
				</div>

				<div className="row" style={{ display: "flex", justifyContent: "center" }}>
					<div className="col-12">
						{((): JSX.Element | null => {
							const dayOfWeek = getDay(new Date(year, meseCorrente, day));
							console.log(dayOfWeek);
							return null;
						})()}
						<div style={{ display: "flex", justifyContent: "space-between", maxWidth: "95%", marginLeft: "auto", marginRight: "auto" }}>
							<div className="nome-data-week">
								Dom {getDay(new Date(year, meseCorrente, day)) === 6 && getAdjustedDay(day, -6, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 5 && getAdjustedDay(day, -5, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 4 && getAdjustedDay(day, -4, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 3 && getAdjustedDay(day, -3, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 2 && getAdjustedDay(day, -2, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 1 && getAdjustedDay(day, -1, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 0 && getAdjustedDay(day, 0, year, meseCorrente)}
								<div className="orario" style={{ fontSize: "0.8vw", width: "calc(100% - 10px)", flex: "1" }}>
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
							<div className="nome-data-week">
								Lun {getDay(new Date(year, meseCorrente, day)) === 6 && getAdjustedDay(day, -5, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 5 && getAdjustedDay(day, -4, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 4 && getAdjustedDay(day, -3, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 3 && getAdjustedDay(day, -2, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 2 && getAdjustedDay(day, -1, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 1 && getAdjustedDay(day, 0, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 0 && getAdjustedDay(day, 1, year, meseCorrente)}
								<div className="orario" style={{ fontSize: "0.8vw", width: "calc(100% - 10px)", flex: "1" }}>
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
							<div className="nome-data-week">
								Mar {getDay(new Date(year, meseCorrente, day)) === 6 && getAdjustedDay(day, -4, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 5 && getAdjustedDay(day, -3, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 4 && getAdjustedDay(day, -2, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 3 && getAdjustedDay(day, -1, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 2 && getAdjustedDay(day, 0, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 1 && getAdjustedDay(day, 1, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 0 && getAdjustedDay(day, 2, year, meseCorrente)}
								<div className="orario" style={{ fontSize: "0.8vw", width: "calc(100% - 10px)", flex: "1" }}>
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
							<div className="nome-data-week">
								Mer {getDay(new Date(year, meseCorrente, day)) === 6 && getAdjustedDay(day, -3, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 5 && getAdjustedDay(day, -2, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 4 && getAdjustedDay(day, -1, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 3 && getAdjustedDay(day, 0, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 2 && getAdjustedDay(day, 1, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 1 && getAdjustedDay(day, 2, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 0 && getAdjustedDay(day, 3, year, meseCorrente)}
								<div className="orario" style={{ fontSize: "0.8vw", width: "calc(100% - 10px)", flex: "1" }}>
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
							<div className="nome-data-week">
								Gio {getDay(new Date(year, meseCorrente, day)) === 6 && getAdjustedDay(day, -2, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 5 && getAdjustedDay(day, -1, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 4 && getAdjustedDay(day, 0, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 3 && getAdjustedDay(day, 1, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 2 && getAdjustedDay(day, 2, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 1 && getAdjustedDay(day, 3, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 0 && getAdjustedDay(day, 4, year, meseCorrente)}
								<div className="orario" style={{ fontSize: "0.8vw", width: "calc(100% - 10px)", flex: "1" }}>
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
							<div className="nome-data-week">
								Ven {getDay(new Date(year, meseCorrente, day)) === 6 && getAdjustedDay(day, -1, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 5 && getAdjustedDay(day, 0, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 4 && getAdjustedDay(day, 1, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 3 && getAdjustedDay(day, 2, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 2 && getAdjustedDay(day, 3, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 1 && getAdjustedDay(day, 4, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 0 && getAdjustedDay(day, 5, year, meseCorrente)}
								<div className="orario" style={{ fontSize: "0.8vw", width: "calc(100% - 10px)", flex: "1" }}>
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
							<div className="nome-data-week">
								Sab {getDay(new Date(year, meseCorrente, day)) === 6 && getAdjustedDay(day, 0, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 5 && getAdjustedDay(day, 1, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 4 && getAdjustedDay(day, 2, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 3 && getAdjustedDay(day, 3, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 2 && getAdjustedDay(day, 4, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 1 && getAdjustedDay(day, 5, year, meseCorrente)}
								{getDay(new Date(year, meseCorrente, day)) === 0 && getAdjustedDay(day, 6, year, meseCorrente)}
								<div className="orario" style={{ fontSize: "0.8vw", width: "calc(100% - 10px)", flex: "1" }}>
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
						</div>

					</div>

				</div>
			</div >}
			{activeButton === 2 && <div style={{ marginTop: "2vw" }}>Month</div>}
		</>
	);
}
