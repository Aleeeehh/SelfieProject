import React, { useState } from "react";
import type Project from "./types/Project";
import { useRefresh } from "./TimeContext";

enum View {
	DAY = "Day",
	WEEK = "Week",
	MONTH = "Month",
}
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
// const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

const GanttDiagram = ({ projects }: { projects: Project[] }): React.JSX.Element => {
	const [start, setStart] = useState<Date>(new Date());
	const [end, setEnd] = useState<Date>(new Date(start.getTime() + THIRTY_DAYS));
	const [points, setPoints] = useState<number[]>([]);
	const [view, setView] = useState<View>(View.DAY);

	const { serverTime } = useRefresh();

	const [limit, setLimit] = useState(0);

	const getPoints = (): void => {
		const points = [];

		// generate points array from start to end, based on view
		if (view === View.DAY) {
			for (let i = 0; i <= (end.getTime() - start.getTime()) / ONE_DAY; i++) {
				const currDate = new Date(start.getTime() + i * ONE_DAY);
				currDate.setHours(0, 0, 0, 0);
				points.push(currDate.getTime());
			}
		} else if (view === View.WEEK) {
			for (let i = 0; i <= (end.getTime() - start.getTime()) / ONE_DAY; i += 7) {
				const currDate = new Date(start.getTime() + i * ONE_DAY);
				currDate.setHours(0, 0, 0, 0);
				points.push(currDate.getTime());
			}
		} else if (view === View.MONTH) {
			// get the first of the month of start
			start.setHours(0, 0, 0, 0);
			start.setDate(1);

			// get the last of the month of end
			end.setHours(0, 0, 0, 0);
			end.setDate(1);
			end.setMonth(end.getMonth() + 1);

			var currentDate = new Date(start.getTime());
			while (currentDate <= end) {
				points.push(currentDate.getTime());
				currentDate.setMonth(currentDate.getMonth() + 1);
			}
		}
		setPoints(points);

		setLimit(
			view === View.DAY
				? ONE_DAY
				: view === View.WEEK
				? 7 * ONE_DAY
				: THIRTY_DAYS + 2 * ONE_DAY
		); // refreshProject()
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

	React.useEffect(() => {
		const startZero = new Date(serverTime);
		startZero.setHours(0, 0, 0, 0);
		setStart(startZero);

		const endZero = new Date(new Date(serverTime).getTime() + THIRTY_DAYS);
		endZero.setHours(0, 0, 0, 0);
		setEnd(endZero);

		getPoints();
	}, [serverTime]);

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
		<div className="gantt-container">
			<h2 className="gantt-title">Diagramma di Gantt - Progetti</h2>

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
				<select
					value={view}
					onChange={(e): void => setView(e.target.value as View)}
					style={{ width: "200px" }}>
					<option value={View.DAY}>Giorno</option>
					<option value={View.WEEK}>Settimana</option>
					<option value={View.MONTH}>Mese</option>
				</select>
				<button onClick={getPoints} className="gantt-update-button">
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
							{points.map((point, index) => (
								<th
									key={index}
									className="gantt-table-head-cell"
									style={
										new Date(serverTime).getTime() <= point &&
										new Date(serverTime).getTime() + limit >= point
											? { backgroundColor: "blueviolet" }
											: {}
									}>
									{new Date(point).toISOString().split("T")[0]}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{projects.map((project) => (
							<>
								{project.activityList.map((task) => (
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
											{points.map((point, i) => (
												<td key={i} className="day-cell">
													{new Date(task.start || serverTime).getTime() <=
														point &&
													point <=
														new Date(task.deadline).getTime() +
															ONE_DAY ? (
														<div
															className="gantt-task-bar"
															style={
																point <
																new Date(serverTime).getTime()
																	? new Date(
																			task.deadline
																	  ).getTime() <
																	  new Date(serverTime).getTime()
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
													{points.map((point, i) => (
														<td key={i} className="day-cell">
															{
																/* getTaskDays(child).includes(day) */
																new Date(child.start!).getTime() <=
																	point &&
																point <=
																	new Date(
																		child.deadline
																	).getTime() +
																		ONE_DAY ? (
																	<div
																		className="gantt-task-bar"
																		style={
																			point <
																			new Date(
																				serverTime
																			).getTime()
																				? new Date(
																						task.deadline
																				  ).getTime() <
																				  new Date(
																						serverTime
																				  ).getTime()
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
							</>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default GanttDiagram;
