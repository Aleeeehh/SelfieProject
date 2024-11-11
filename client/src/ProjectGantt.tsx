import React, { useState } from "react";

type Task = {
	id: number;
	name: string;
	startDate: string;
	endDate: string;
	users: string[];
};

const dummyProject = { name: "Dummy Project" };
const dummyData = [
	{
		id: 1,
		name: "Task 1",
		startDate: "2024-11-01",
		endDate: "2024-11-07",
		users: ["fv1"],
	},
	{
		id: 2,
		name: "Task 2",
		startDate: "2024-11-08",
		endDate: "2024-11-14",
		users: ["fv1", "fv2"],
	},
	{
		id: 3,
		name: "Task 3",
		startDate: "2024-11-15",
		endDate: "2024-11-21",
		users: ["fv1", "fv3", "fvPM"],
	},
	// Add more tasks here...
];

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
// const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

const GanttDiagram = (): React.JSX.Element => {
	const [start, setStart] = useState<Date>(new Date());
	const [end, setEnd] = useState<Date>(new Date(start.getTime() + THIRTY_DAYS));
	const [days, setDays] = useState<number[]>([]);

	const getDays = (): void => {
		const days = [];

		// generate days array from start to end
		for (let i = 0; i <= (end.getTime() - start.getTime()) / ONE_DAY; i++) {
			const currDate = new Date(start.getTime() + i * ONE_DAY);
			currDate.setHours(0, 0, 0, 0);
			days.push(currDate.getTime());
		}

		console.log("Days: " + days);
		console.log(days.length);
		setDays(days);
	};

	const getTaskDays = (task: Task): number[] => {
		const startDate = new Date(task.startDate);
		startDate.setHours(0, 0, 0, 0);
		const endDate = new Date(task.endDate);
		endDate.setHours(0, 0, 0, 0);

		const taskDays = [];
		for (let i = 0; i <= (endDate.getTime() - startDate.getTime()) / ONE_DAY; i++) {
			taskDays.push(startDate.getTime() + i * ONE_DAY);
		}

		console.log("Task " + task.name + " days: " + taskDays);
		return taskDays;
	};

	React.useEffect(() => {
		getDays();

		const startZero = new Date(start.getTime());
		startZero.setHours(0, 0, 0, 0);
		setStart(startZero);

		const endZero = new Date(end.getTime());
		endZero.setHours(0, 0, 0, 0);
		setEnd(endZero);
	}, []);

	function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
		try {
			const inputDate = new Date(e.target.value);
			// Ensure the date is valid and format it to YYYY-MM-DD
			const formattedDate = inputDate.toISOString().split("T")[0];
			if (e.target.name === "start") {
				setStart(new Date(formattedDate));
			} else if (e.target.name === "end") {
				setEnd(new Date(formattedDate));
			}
		} catch (e) {
			console.log(e);
		}
	}

	return (
		<div>
			<div style={{ margin: "auto", textAlign: "center" }}>
				Diagramma di Gantt - Progetto: {dummyProject.name}
			</div>
			<div>
				<input
					type="date"
					name="start"
					value={start ? start.toISOString().split("T")[0] : ""}
					onChange={handleChange}
				/>
				<input
					type="date"
					name="end"
					value={end ? end.toISOString().split("T")[0] : ""}
					onChange={handleChange}
				/>
				<button onClick={getDays}>Aggiorna</button>
			</div>
			<table style={{ overflowX: "scroll" }}>
				<thead>
					<tr>
						<th>Task</th>
						<th>Partecipanti</th>
						{days.map((day, index) => (
							<th key={index}>{new Date(day).toISOString().split("T")[0]}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{dummyData.map((task, index) => (
						<tr key={index}>
							<td>{task.name}</td>
							<td>
								{task.users.map((u) => (
									<div>{u}</div>
								))}
							</td>
							{days.map((day, index) => (
								<td key={index}>
									{getTaskDays(task).includes(day) ? (
										<div
											style={{
												backgroundColor: "blue",
												width: "10px",
												height: "10px",
											}}
										/>
									) : (
										<div
											style={{
												backgroundColor: "gray",
												width: "10px",
												height: "10px",
											}}
										/>
									)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default GanttDiagram;
