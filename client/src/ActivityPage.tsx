import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseStatus } from "./types/ResponseStatus";
import { useNavigate, useParams } from "react-router-dom";
// import { marked } from "marked";
// import UserResult from "./types/UserResult";
import type Activity from "./types/Activity";
import { ActivityStatus, AdvancementType } from "./types/Activity";
import type Project from "./types/Project";
import DatePicker from "react-datepicker";
import SearchForm from "./SearchForm";

//TODO: aggiungere un bottone per uscire dalla creazione di una nota
const dummyActivity: Activity = {
    id: "6735dd4a516cf3e8d510ae08",
    owner: "6735dc1c5d397ea3c3e2b616",
    title: "testtitle",
    description: "test",
    createdAt: new Date("2024-11-14T11:21:46.325Z"),
    updatedAt: new Date("2024-11-14T11:21:46.325Z"),
    deadline: new Date("2024-11-11T00:00:00.000Z"),
    completed: false,
    accessList: ["fv2"],
    next: null,
    status: ActivityStatus.ACTIVABLE,
    milestone: false,
    advancementType: AdvancementType.TRANSLATION,
    parent: null,
    // start: new Date("2024-11-10T00:00:00.000Z"),
    children: [
        {
            id: "6735e7226c68b78ecea68fd6",
            title: "testtitle",
            description: "test",
            deadline: new Date("2024-11-11T00:00:00.000Z"),
            completed: false,
            owner: "6735dc1c5d397ea3c3e2b616",
            accessList: ["fv2"],
            projectId: "6735dc405d397ea3c3e2b63b",
            // start: new Date("2024-11-10T00:00:00.000Z"),
            milestone: null,
            advancementType: null,
            parent: "6735dd4a516cf3e8d510ae08",
            next: null,
            status: ActivityStatus.ACTIVABLE,
            children: [],
        },
    ],
};

export default function ActivityPage(): React.JSX.Element {
    const { id } = useParams();
    const [message, setMessage] = React.useState("");
    const [activity, setActivity] = React.useState<Activity>(dummyActivity);
    const [project, setProject] = React.useState<Project | null>(null);
    const [isEditing, setIsEditing] = React.useState(false);

    const nav = useNavigate();

    function refreshActivity(): void {
        fetch(`${SERVER_API}/activity/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.status === ResponseStatus.GOOD) {
                    setActivity(data.value as Activity);
                    console.log("Attività: ", data.value);
                } else {
                    console.log(
                        data.message || "Errore nel caricamento dell'attività"
                    );
                    nav("/activities");
                }
            })
            .then(() => refreshProject())
            .catch(() => {
                setMessage("Impossibile raggiungere il server");
                // nav("/projects");
            });
    }

    function refreshProject(): void {
        fetch(`${SERVER_API}/projects/${activity.projectId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.status === ResponseStatus.GOOD) {
                    setProject(data.value as Project);
                    console.log("Progetto: ", data.value);
                } else {
                    console.log(
                        data.message || "Errore nel caricamento del progetto"
                    );
                    // nav("/projects");
                }
            })
            .catch(() => {
                setMessage("Impossibile raggiungere il server");
                // nav("/projects");
            });
    }

    function handleTextChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ): void {
        setActivity({ ...activity, [e.target.name]: e.target.value });
    }

    function handleCheckboxChange(
        e: React.ChangeEvent<HTMLInputElement>
    ): void {
        setActivity({ ...activity, [e.target.name]: e.target.checked });
    }

    function getPossibleNextList(
        a: Activity[]
    ): { id: string; title: string }[] {
        let possibleNext: { id: string; title: string }[] = [];

        let found = false;
        for (const child of a) {
            if (child.id === activity.id) found = true;

            // recursive call
            possibleNext.concat(getPossibleNextList(child.children || []));
        }

        if (found) {
            for (const child of a) {
                if (child.id !== activity.id) {
                    possibleNext.push({
                        id: child.id || "",
                        title: child.title,
                    });
                }
            }
        }

        return possibleNext;
    }

    function addUser(
        e: React.ChangeEvent<HTMLSelectElement>,
        user: string
    ): void {
        e.preventDefault();

        if (
            !activity.accessList.includes(user) &&
            project?.accessList.includes(user)
        )
            // TODO: optimize
            setActivity((prevAct) => {
                return {
                    ...prevAct,
                    accessList: [...prevAct.accessList, user],
                };
            });
    }

    function deleteUser(
        e: React.MouseEvent<HTMLElement>,
        username: string
    ): void {
        e.preventDefault();

        setActivity((prevAct) => {
            return {
                ...prevAct,
                accessList: prevAct.accessList.filter((u) => u !== username),
            };
        });
    }

    function handleUpdateActivity(
        e: React.MouseEvent<HTMLButtonElement>
    ): void {
        e.preventDefault();

        console.log("Updating activity: ", JSON.stringify(activity));

        fetch(`${SERVER_API}/activity/${activity.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: activity.title,
                description: activity.description,
                accessList: activity.accessList,
                deadline: new Date(activity.deadline)
                    .toISOString()
                    .split("T")[0],
                completed: activity.completed,
                completedAt: activity.completedAt,
                idEventoNotificaCondiviso: activity.idEventoNotificaCondiviso,
                projectId: activity.projectId,
                // start: activity.start?.toISOString().split("T")[0] || undefined,
                milestone: activity.milestone,
                parent: activity.parent,
                prev: activity.prev,
                next: activity.next,
                advancementType: activity.advancementType,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === ResponseStatus.GOOD) {
                    refreshActivity();
                    setIsEditing(false);
                } else {
                    console.log(data.message || "Errore nell'aggiornamento");
                    setMessage(data.message || "Errore nell'aggiornamento");
                }
            })
            .catch(() => {
                setMessage("Impossibile raggiungere il server");
            });
    }

    function handleDeleteActivity(
        e: React.MouseEvent<HTMLButtonElement>
    ): void {
        e.preventDefault();

        fetch(`${SERVER_API}/activity/${activity.id}`, {
            method: "DELETE",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === ResponseStatus.GOOD) {
                    alert("Attività eliminata correttamente");
                    nav("/activities");
                } else {
                    console.log(
                        data.message || "Errore durante l'eliminazione"
                    );
                    setMessage(data.message || "Errore durante l'eliminazione");
                }
            })
            .catch(() => {
                setMessage("Impossibile raggiungere il server");
            });
    }

    function handleAbortChanges(e: React.MouseEvent<HTMLButtonElement>): void {
        e.preventDefault();

        refreshActivity();
        setIsEditing(false);
    }
    // On page load, get the project data
    React.useEffect(() => {
        refreshActivity();
    }, []);

    React.useEffect(() => {
        if (activity.projectId) {
            refreshProject();
        }
    }, [activity.projectId]);

    return (
        <>
            <div className="activity-background">
                {!isEditing ? (
                    <>
                        <div className="activity-container">
                            <div className="activity-page-title">
                                <a href="/activities" className="close-link">
                                    X
                                </a>
                            </div>
                            {/* render title */}
                            <div className="activity-title">
                                <div>Titolo</div>
                                <div>{activity.title}</div>
                            </div>
                            {/* render description */}
                            <div className="activity-description">
                                <div>Descrizione</div>
                                <div>{activity.description}</div>
                            </div>
                            {/* render project */}
                            {project && activity.projectId && (
                                <div className="activity-project">
                                    <div>
                                        Questa attività fa parte di un progetto:{" "}
                                        <a
                                            href={`/projects/${activity.projectId}`}
                                        >
                                            {project.title}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {/* render completed */}
                            <div className="activity-completed">
                                <div>
                                    Completa? {activity.completed ? "Si" : "No"}
                                </div>
                            </div>
                            {/* render status */}
                            <div className="activity-status">
                                <div>
                                    Status: <b>{activity.status}</b>
                                </div>
                            </div>
                            {/* render milestone */}
                            <div className="activity-milestone">
                                <div>
                                    Milestone?{" "}
                                    {activity.milestone ? "Si" : "No"}
                                </div>
                            </div>
                            {/* render advancement type */}
                            <div className="activity-advancementType">
                                <div>
                                    Tipo di avanzamento:{" "}
                                    {activity.advancementType}
                                </div>
                            </div>
                            {/* render dates */}
                            <div className="activity-dates">
                                <div>
                                    Da completare entro:{" "}
                                    {new Date(activity.deadline).toISOString()}
                                </div>
                            </div>
                            {/* render access list */}
                            <label>
                                Utenti partecipanti all'attività
                                <div className="activity-users-container">
                                    {activity.accessList.length ? (
                                        activity.accessList.map((u) => (
                                            <div className="activity-user-box">
                                                {u}
                                            </div>
                                        ))
                                    ) : (
                                        <div>Nessun partecipante</div>
                                    )}
                                </div>
                            </label>

                            {/* parent */}
                            <a
                                href={
                                    activity.parent
                                        ? "/activities/" + activity.parent
                                        : ""
                                }
                            >
                                <div>
                                    Parent: {activity.parent || "Nessuno"}
                                </div>
                            </a>

                            {/* next */}
                            <a
                                href={
                                    activity.next
                                        ? "/activities/" + activity.next
                                        : ""
                                }
                            >
                                <div>
                                    Prossima attività:{" "}
                                    {activity.next || "Nessuna"}
                                </div>
                            </a>

                            {/* render children list */}
                            <div>
                                <div>Sotto Attività: </div>
                                {activity.children &&
                                    (activity.children.length ? (
                                        activity.children.map((a) => (
                                            <a href={"/activities/" + a.id}>
                                                <div>{a.title}</div>
                                            </a>
                                        ))
                                    ) : (
                                        <div>Nessuna sotto attività</div>
                                    ))}
                            </div>
                        </div>
                        <button
                            onClick={(
                                e: React.MouseEvent<HTMLButtonElement>
                            ): void => {
                                e.preventDefault();
                                setIsEditing(true);
                            }}
                        >
                            Modifica
                        </button>
                    </>
                ) : (
                    <>
                        <div className="activity-container">
                            {/* Render updating activity*/}
                            {/* render title */}
                            <label className="activity-title">
                                Titolo
                                <input
                                    type="text"
                                    name="title"
                                    value={activity.title}
                                    onChange={handleTextChange}
                                />
                            </label>
                            {/* render description */}
                            <label className="activity-description">
                                Descrizione
                                <input
                                    type="textarea"
                                    name="description"
                                    value={activity.description}
                                    onChange={handleTextChange}
                                />
                            </label>
                            {/* render project */}
                            {project && activity.projectId && (
                                <div className="activity-project">
                                    <div>
                                        Questa attività fa parte di un progetto:{" "}
                                        <a
                                            href={`/projects/${activity.projectId}`}
                                        >
                                            {project.title}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {/* render completed */}
                            <label className="activity-completed">
                                Completa?
                                <input
                                    type="checkbox"
                                    name="completed"
                                    checked={activity.completed}
                                    onChange={handleCheckboxChange}
                                />
                            </label>
                            {/* render status */}
                            <div className="activity-status">
                                <div>
                                    Status: <b>{activity.status}</b>
                                </div>
                            </div>

                            {/* render milestone */}
                            <label className="activity-milestone">
                                Milestone?
                                <input
                                    type="checkbox"
                                    name="milestone"
                                    checked={activity.milestone || false}
                                    onChange={handleCheckboxChange}
                                />
                            </label>
                            {/* render advancement type */}
                            <label
                                htmlFor="advancementType"
                                className="activity-vertical"
                            >
                                Tipo di avanzamento:
                                <select
                                    style={{ backgroundColor: "white" }}
                                    className="btn border"
                                    name="advancementType"
                                    onChange={(
                                        e: React.ChangeEvent<HTMLSelectElement>
                                    ): void => {
                                        setActivity({
                                            ...activity,
                                            advancementType: e.target
                                                .value as AdvancementType,
                                        });
                                    }}
                                    value={
                                        activity.advancementType || undefined
                                    }
                                >
                                    <option
                                        key={AdvancementType.TRANSLATION}
                                        value={AdvancementType.TRANSLATION}
                                    >
                                        {AdvancementType.TRANSLATION}
                                    </option>
                                    <option
                                        key={AdvancementType.CONTRACTION}
                                        value={AdvancementType.CONTRACTION}
                                    >
                                        {AdvancementType.CONTRACTION}
                                    </option>
                                </select>
                            </label>
                            {/* render dates */}
                            <label
                                htmlFor="endTime"
                                className="activity-vertical"
                            >
                                Scadenza
                                <div>
                                    <DatePicker
                                        className="btn border"
                                        name="endTime"
                                        selected={activity.deadline}
                                        onChange={(date: Date | null): void => {
                                            if (date) {
                                                // Aggiorna la data mantenendo l'orario attuale
                                                const newDate = new Date(
                                                    activity.deadline
                                                );
                                                newDate.setFullYear(
                                                    date.getFullYear(),
                                                    date.getMonth(),
                                                    date.getDate()
                                                );
                                                setActivity({
                                                    ...activity,
                                                    deadline: newDate,
                                                });
                                            }
                                        }}
                                    />
                                </div>
                            </label>

                            {/* render access list */}
                            <label>
                                Utenti partecipanti all'attività
                                <SearchForm
                                    onItemClick={addUser}
                                    list={activity.accessList}
                                />
                                {activity.accessList.map((u) => (
                                    <div className="activity-user-box">
                                        {u}
                                        <button
                                            onClick={(
                                                e: React.MouseEvent<HTMLButtonElement>
                                            ): void => deleteUser(e, u)}
                                        >
                                            X
                                        </button>
                                    </div>
                                ))}
                            </label>
                            {/* parent*/}
                            <label
                                htmlFor="parent"
                                className="activity-vertical"
                            >
                                Attività padre: {activity.parent || "Nessuna"}{" "}
                                (Non modificabile)
                            </label>
                            {/* next */}
                            <label htmlFor="next" className="activity-vertical">
                                Attività successiva:{" "}
                                {activity.next || "Nessuna"}
                                <select
                                    style={{ backgroundColor: "white" }}
                                    className="btn border"
                                    name="next"
                                    onChange={(
                                        e: React.ChangeEvent<HTMLSelectElement>
                                    ): void => {
                                        setActivity({
                                            ...activity,
                                            next: e.target.value,
                                        });
                                    }}
                                >
                                    <option value="">Nessuna</option>
                                    {project &&
                                        getPossibleNextList(
                                            project.activityList
                                        ).map((act) => (
                                            <option
                                                key={act.title}
                                                value={act.id}
                                            >
                                                {act.title}
                                            </option>
                                        ))}
                                </select>
                            </label>
                            {/* render children list */}
                            <div>
                                <div>sotto-attività</div>
                                {activity.children &&
                                    activity.children.map((a) => (
                                        <a href={"/activities/" + a.id}>
                                            <div>{a.title}</div>
                                        </a>
                                    ))}
                            </div>
                        </div>
                        <button onClick={handleUpdateActivity}>
                            Termina modifiche
                        </button>
                        <button onClick={handleAbortChanges}>
                            Annulla Modifiche
                        </button>
                        <button onClick={handleDeleteActivity}>
                            Elimina Attività
                        </button>
                    </>
                )}
            </div>

            {message && <div>{message}</div>}
        </>
    );
}
