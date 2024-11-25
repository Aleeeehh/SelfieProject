import React from "react";

import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import { useNavigate } from "react-router-dom";
// import { marked } from "marked";
// import UserResult from "./types/UserResult";
import SearchForm from "./SearchForm";
import type Project from "./types/Project";
import type Activity from "./types/Activity";

const baseProject: Project = {
	id: "",
	title: "",
	description: "",
	owner: "",
	accessList: [] as string[],
	activityList: [] as Activity[],
};

//TODO: aggiungere un bottone per uscire dalla creazione di una nota

export default function CreateProjectForm(): React.JSX.Element {
	const [project, setProject] = React.useState(baseProject);
	const [message, setMessage] = React.useState("");

	const nav = useNavigate();

	function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
		setProject({ ...project, [e.target.name]: e.target.value });
	}

	async function handleCreateProject(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
		e.preventDefault();

		try {
			const res = await fetch(`${SERVER_API}/projects`, {
				method: "POST",
				body: JSON.stringify({
					title: project.title,
					description: project.description,
					accessList: project.accessList,
				}),
				headers: { "Content-Type": "application/json" },
			});

			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				const newNoteId: string = resBody.value;
				alert("Progetto creato correttamente!");

				// redirect to update page of the created note
				nav(`/projects/${newNoteId}`);
			} else {
				setMessage(resBody.message || "Errore nel caricamento del progetto");
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	function addUser(e: React.ChangeEvent<HTMLSelectElement>, user: string): void {
		e.preventDefault();

		if (!project.accessList.includes(user))
			// TODO: optimize
			setProject((prevProj) => {
				return {
					...prevProj,
					accessList: [...prevProj.accessList, user],
				};
			});
	}

	function deleteUser(e: React.MouseEvent<HTMLElement>, username: string): void {
		e.preventDefault();

		setProject((prevProj) => {
			return {
				...prevProj,
				accessList: prevProj.accessList.filter((u) => u !== username),
			};
		});
	}

	return (
		<>
			<div className="project-background">
				<div className="project-container">
					<div className="project-page-title">
						Crea un nuovo progetto
						<a href="/projects" className="project-close-link">
							X
						</a>
					</div>
					{/* render title */}
					<label htmlFor="title">
						Titolo
						<input name="title" value={project.title} onChange={handleChange} />
					</label>

					{/* render description */}
					<label htmlFor="description">
						Descrizione
						<textarea
							name="description"
							value={project.description}
							onChange={handleChange}
							maxLength={1500}
						/>
					</label>

					{/* render access list */}
					<label>
						<div>Utenti partecipanti al progetto</div>
						<div className="project-users-form">
							<label>
								<SearchForm onItemClick={addUser} list={project.accessList} />
							</label>
						</div>
						<div className="project-users-container">
							{project.accessList.map((u) => (
								<div className="project-user-box">
									{u}

									<button
										style={{
											marginLeft: "0.5em",
											padding: "0",
											backgroundColor: "#d64545",
										}}
										className="project-user-delete"
										onClick={(e: React.MouseEvent<HTMLButtonElement>): void =>
											deleteUser(e, u)
										}>
										X
									</button>
								</div>
							))}
						</div>
					</label>

					{/* manage project */}
					<button onClick={handleCreateProject}>Crea nuovo progetto</button>
				</div>
			</div>

			{message && <div>{message}</div>}
		</>
	);
}
