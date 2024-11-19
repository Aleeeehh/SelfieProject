import React, { useState } from "react";
// import Activity, { ActivityStatus } from "./types/Activity";
import { useNavigate, useParams } from "react-router-dom";
import { SERVER_API } from "./params/params";
import { ResponseStatus } from "./types/ResponseStatus";
import type Project from "./types/Project";

/* type Task = {
	id: number;
	title: string;
	start: string;
	deadline: string;
	accessList: string[];
	status: ActivityStatus | null;
	children?: Task[];
};

const dummyData: Task[] = [
	{
		id: 1,
		title: "Task 1",
		start: "2024-11-01",
		deadline: "2024-11-07",
		accessList: ["fv1"],
		status: ActivityStatus.COMPLETED,
		children: [
			{
				id: 4,
				title: "Sub task 1-1",
				start: "2024-11-01",
				deadline: "2024-11-07",
				status: ActivityStatus.COMPLETED,

				accessList: ["fv1"],
			},
		],
	},
	{
		id: 2,
		title: "Task 2",
		start: "2024-11-08",
		deadline: "2024-11-14",
		accessList: ["fv1", "fv2"],
		status: ActivityStatus.ACTIVE,
	},
	{
		id: 3,
		title: "Task 3",
		start: "2024-11-15",
		deadline: "2024-11-21",
		accessList: ["fv1", "fv3", "fvPM"],
		status: ActivityStatus.NOT_ACTIVABLE,

		children: [
			{
				id: 4,
				title: "Sub task 3-1",
				start: "2024-11-15",
				deadline: "2024-11-18",
				accessList: ["fv1"],
				status: ActivityStatus.NOT_ACTIVABLE,
			},
			{
				id: 4,
				title: "Sub task 3-1",
				start: "2024-11-20",
				deadline: "2024-11-21",
				accessList: ["fv3"],
				status: ActivityStatus.NOT_ACTIVABLE,
			},
		],
	},
	{
		id: 4,
		title: "Task 4",
		start: "2024-11-30",
		deadline: "2024-12-21",
		accessList: ["fv1", "fv3", "fvPM"],
		status: ActivityStatus.NOT_ACTIVABLE,

		children: [
			{
				id: 4,
				title: "Sub task 4-1",
				start: "2024-11-30",
				deadline: "2024-12-10",
				accessList: ["fv1"],
				status: ActivityStatus.NOT_ACTIVABLE,
			},
			{
				id: 4,
				title: "Sub task 4-1",
				start: "2024-12-10",
				deadline: "2024-12-21",
				accessList: ["fv3"],
				status: ActivityStatus.NOT_ACTIVABLE,
			},
		],
	},
	// Add more tasks here...
];*/

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
// const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

const GanttDiagram = (): React.JSX.Element => {
	const { id } = useParams();
	const [start, setStart] = useState<Date>(new Date());
	const [end, setEnd] = useState<Date>(new Date(start.getTime() + THIRTY_DAYS));
	const [days, setDays] = useState<number[]>([]);
	const [project, setProject] = useState<Project | null>(null);
	const [message, setMessage] = useState("");

	const nav = useNavigate();

	const getDays = (): void => {
		const days = [];

		// generate days array from start to end
		for (let i = 0; i <= (end.getTime() - start.getTime()) / ONE_DAY; i++) {
			const currDate = new Date(start.getTime() + i * ONE_DAY);
			currDate.setHours(0, 0, 0, 0);
			days.push(currDate.getTime());
		}

		setDays(days);
		// refreshProject();
	};

	/* const getTaskDays = (task: Activity): number[] => {
		const startDate = new Date(task.start || Date.now());
		startDate.setHours(0, 0, 0, 0);
		const endDate = new Date(task.deadline);
		endDate.setHours(0, 0, 0, 0);

		const taskDays = [];
		for (let i = 0; i <= (endDate.getTime() - startDate.getTime()) / ONE_DAY; i++) {
			taskDays.push(startDate.getTime() + i * ONE_DAY);
		}

		console.log(taskDays);
		return taskDays;
	};*/

	async function refreshProject(): Promise<void> {
		fetch(`${SERVER_API}/projects/${id}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.status === ResponseStatus.GOOD) {
					setProject(data.value as Project);
					console.log(data.value);
				} else {
					console.log(data.message || "Errore nel caricamento del progetto");
					nav("/projects");
				}
			})
			.catch(() => {
				setMessage("Impossibile raggiungere il server");
				console.log("Impossibile raggiungere il server");
				nav("/projects");
			});
	}

	React.useEffect(() => {
		const startZero = new Date(start.getTime());
		startZero.setHours(0, 0, 0, 0);
		setStart(startZero);

		const endZero = new Date(end.getTime());
		endZero.setHours(0, 0, 0, 0);
		setEnd(endZero);

		getDays();
		refreshProject();
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
		<div className="gantt-background">
			<div className="gantt-container">
				<h2 className="gantt-title">Diagramma di Gantt - Progetto: {project?.title}</h2>

				<div className="gantt-date-input-container">
					<input
						type="date"
						name="start"
						value={start ? start.toISOString().split("T")[0] : ""}
						onChange={handleChange}
						className="gantt-date-input"
					/>
					<input
						type="date"
						name="end"
						value={end ? end.toISOString().split("T")[0] : ""}
						onChange={handleChange}
						className="gantt-date-input"
					/>
					<button onClick={getDays} className="gantt-update-button">
						Aggiorna
					</button>
				</div>

				<div className="gantt-table-container">
					<table className="gantt-table">
						<thead className="gantt-table-header">
							<tr>
								<th className="gantt-table-head-cell">Task</th>
								<th className="gantt-table-head-cell">Sub Task</th>
								<th className="gantt-table-head-cell">Partecipanti</th>
								{days.map((day, index) => (
									<th
										key={index}
										className="gantt-table-head-cell"
										style={
											Date.now() <= day && Date.now() + ONE_DAY >= day
												? { backgroundColor: "blueviolet" }
												: {}
										}>
										{new Date(day).toISOString().split("T")[0]}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{project &&
								project.activityList.map((task) => (
									<>
										<tr key={"row -" + task?.id} className="table-row">
											<td className="gantt-task-cell">{task.title}</td>
											<td></td>
											<td className="gantt-participants-cell">
												{task.accessList.map((u, i) => (
													<div key={i} className="gantt-participant">
														{u}
													</div>
												))}
											</td>
											{days.map((day, dayIndex) => (
												<td key={dayIndex} className="day-cell">
													{new Date(task.start || Date.now()).getTime() <=
														day &&
													day <=
														new Date(task.deadline).getTime() +
															ONE_DAY ? (
														<div
															className="gantt-task-bar"
															style={
																day < Date.now()
																	? new Date(
																			task.deadline
																	  ).getTime() < Date.now()
																		? {
																				backgroundColor:
																					"darkred",
																		  }
																		: {
																				backgroundColor:
																					"orange",
																		  }
																	: { backgroundColor: "green" }
															}></div>
													) : (
														<div className="gantt-empty-cell"></div>
													)}
												</td>
											))}
										</tr>
										{task.children &&
											task.children.map((child) => (
												<tr
													key={"row -" + task?.id + child?.id}
													className="table-row">
													<td></td>
													<td className="gantt-task-cell">
														{child.title}
													</td>
													<td className="gantt-participants-cell">
														{child.accessList.map((u, i) => (
															<div
																key={i}
																className="gantt-participant">
																{u}
															</div>
														))}
													</td>
													{days.map((day, dayIndex) => (
														<td key={dayIndex} className="day-cell">
															{
																/* getTaskDays(child).includes(day) */
																new Date(child.start!).getTime() <=
																	day &&
																day <=
																	new Date(
																		child.deadline
																	).getTime() +
																		ONE_DAY ? (
																	<div
																		className="gantt-task-bar"
																		style={
																			day < Date.now()
																				? new Date(
																						task.deadline
																				  ).getTime() <
																				  Date.now()
																					? {
																							backgroundColor:
																								"darkred",
																					  }
																					: {
																							backgroundColor:
																								"orange",
																					  }
																				: {
																						backgroundColor:
																							"green",
																				  }
																		}></div>
																) : (
																	<div className="gantt-empty-cell"></div>
																)
															}
														</td>
													))}
												</tr>
											))}
									</>
								))}
						</tbody>
					</table>
				</div>
			</div>
			{message && <div>{message}</div>}
		</div>
	);
};

export default GanttDiagram;
