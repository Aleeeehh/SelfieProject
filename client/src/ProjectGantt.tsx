import React from "react";
import type Project from "./types/Project";
import { useRefresh } from "./TimeContext";

enum View {
	DAY = "Day",
	WEEK = "Week",
	MONTH = "Month",
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

interface GanttInput {
	dateStart: Date;
	dateEnd: Date;
	view: View;
}

interface GanttOutput extends GanttInput {
	points: number[];
	limit: number;
}

const GanttDiagram = ({ projects }: { projects: Project[] }): React.JSX.Element => {
	const [inputs, setInputs] = React.useState<GanttInput>({
		dateStart: new Date(),
		dateEnd: new Date(new Date().getTime() + THIRTY_DAYS),
		view: View.DAY,
	});

	const [outputs, setOutputs] = React.useState<GanttOutput>({
		points: [],
		limit: 0,
		dateStart: new Date(),
		dateEnd: new Date(new Date().getTime() + THIRTY_DAYS),
		view: View.DAY,
	});

	const { serverTime } = useRefresh();

	const getPoints = (): { view: View; points: number[]; limit: number } => {
		const points = [];

		const start = new Date(inputs.dateStart);
		const end = new Date(inputs.dateEnd);
		const view = inputs.view;

		// Generate points array from start to end, based on view
		if (inputs.view === View.DAY) {
			for (let i = 0; i <= (end.getTime() - start.getTime()) / ONE_DAY; i++) {
				const currDate = new Date(start.getTime() + i * ONE_DAY);
				currDate.setHours(0, 0, 0, 0);
				points.push(currDate.getTime());
			}
		} else if (inputs.view === View.WEEK) {
			for (let i = 0; i <= (end.getTime() - start.getTime()) / ONE_DAY; i += 7) {
				const currDate = new Date(start.getTime() + i * ONE_DAY);
				currDate.setHours(0, 0, 0, 0);
				points.push(currDate.getTime());
			}
		} else if (inputs.view === View.MONTH) {
			// Get the first of the month of start
			start.setHours(0, 0, 0, 0);
			start.setDate(1);

			// Get the last of the month of end
			end.setHours(0, 0, 0, 0);
			end.setDate(1);
			end.setMonth(end.getMonth() + 1);

			var currentDate = new Date(start.getTime());
			while (currentDate <= end) {
				points.push(currentDate.getTime());
				currentDate.setMonth(currentDate.getMonth() + 1);
			}
		}

		const limit =
			view === View.DAY
				? ONE_DAY
				: view === View.WEEK
				? 7 * ONE_DAY
				: THIRTY_DAYS + 2 * ONE_DAY;

		return { view, points, limit };
	};

	// React.useEffect(() => {
	// 	const startZero = new Date(serverTime);
	// 	startZero.setHours(0, 0, 0, 0);
	// 	setStart(startZero);

	// 	const endZero = new Date(new Date(serverTime).getTime() + THIRTY_DAYS);
	// 	endZero.setHours(0, 0, 0, 0);
	// 	setEnd(endZero);

	// 	getPoints();
	// }, [serverTime]);

	return (
		<div className="gantt-container">
			<h2 className="gantt-title">Diagramma di Gantt - Progetti</h2>

			<div className="gantt-date-input-container">
				<input
					type="date"
					name="start"
					value={inputs.dateStart ? inputs.dateStart.toISOString().split("T")[0] : ""}
					onChange={(e): void =>
						setInputs({
							...inputs,
							dateStart: new Date(
								new Date(e.target.value).toISOString().split("T")[0]
							),
						})
					}
					className="gantt-date-input"
				/>
				<input
					type="date"
					name="end"
					value={inputs.dateEnd ? inputs.dateEnd.toISOString().split("T")[0] : ""}
					onChange={(e): void =>
						setInputs({
							...inputs,
							dateEnd: new Date(new Date(e.target.value).toISOString().split("T")[0]),
						})
					}
					className="gantt-date-input"
				/>
				<select
					value={inputs.view}
					onChange={(e): void => setInputs({ ...inputs, view: e.target.value as View })}
					style={{ width: "200px" }}>
					<option value={View.DAY}>Giorno</option>
					<option value={View.WEEK}>Settimana</option>
					<option value={View.MONTH}>Mese</option>
				</select>
				<button
					onClick={(): void => setOutputs({ ...outputs, ...getPoints() })}
					className="gantt-update-button">
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
							{outputs.points.map((point, index) => (
								<th
									key={index}
									className="gantt-table-head-cell"
									style={
										new Date(serverTime).getTime() <= point &&
										new Date(serverTime).getTime() + outputs.limit >= point
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
											{outputs.points.map((point, i) => (
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
													{outputs.points.map((point, i) => (
														<td key={i} className="day-cell">
															{new Date(child.start!).getTime() <=
																point &&
															point <=
																new Date(child.deadline).getTime() +
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
															)}
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
