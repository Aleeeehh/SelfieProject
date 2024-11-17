import React from "react";
import { SERVER_API } from "./params/params";
import type { ResponseBody } from "./types/ResponseBody";
import { useNavigate } from "react-router-dom";
import { ResponseStatus } from "./types/ResponseStatus";
import type Activity from "./types/Activity";

const PREVIEW_CHARS = 200;
export default function Activities(): React.JSX.Element {
    const [message, setMessage] = React.useState("");
    const [activities, setActivities] = React.useState([] as Activity[]);

    const userId = localStorage.getItem("loggedUserId");

    const nav = useNavigate();

    function updateActivities(): void {
        fetch(`${SERVER_API}/activity`)
            .then((res) => res.json())
            .then((data) => {
                if (data.status === ResponseStatus.GOOD) {
                    setActivities(data.value as Activity[]);
                    console.log(data.value);
                } else {
                    console.log(
                        data.message || "Errore nel caricamento delle attività"
                    );
                    // nav("/projects");
                }
            })
            .catch(() => {
                setMessage("Impossibile raggiungere il server");
                // nav("/projects");
            });
    }

    // On page load, get the events for the user
    React.useEffect(() => {
        updateActivities();
    }, []);

    async function handleDelete(
        e: React.MouseEvent<HTMLButtonElement>,
        id: string | undefined
    ): Promise<void> {
        e.preventDefault();

        if (!id) {
            setMessage(
                "Errore nel cancellamento dell'attività: id non trovato. Errore del server?"
            );
            return;
        }

        try {
            const res = await fetch(`${SERVER_API}/activity/${id}`, {
                method: "DELETE",
            });
            const resBody = (await res.json()) as ResponseBody;
            console.log(resBody);
            if (res.status === 200) {
                updateActivities();
            } else {
                setMessage(
                    resBody.message || "Errore nel cancellamento dell'attività"
                );
            }
        } catch (e) {
            setMessage("Impossibile raggiungere il server");
        }
    }

    return (
        <>
            {message && <div>{message}</div>}
            <div className="activities-container">
                <a href={`/activities/new`} style={{ marginTop: "1em" }}>
                    <button>Crea nuova attività</button>
                </a>
                <div className="activities-list">
                    {activities.map((activity) => (
                        <div className="card-activity">
                            <div className="card-activity-title">
                                <h3>{activity.title}</h3>
                            </div>
                            <div className="card-activity-description">
                                <p>
                                    {activity.description.length > PREVIEW_CHARS
                                        ? activity.description.substring(
                                              0,
                                              PREVIEW_CHARS
                                          ) + "..."
                                        : activity.description}
                                </p>
                            </div>
                            <div className="card-activity-buttons">
                                <button
                                    onClick={(): void =>
                                        nav(`/activities/${activity.id}`)
                                    }
                                >
                                    Visualizza
                                </button>
                                {activity.owner === userId && (
                                    <button
                                        style={{ backgroundColor: "#ff6b6b" }}
                                        onClick={async (
                                            e: React.MouseEvent<HTMLButtonElement>
                                        ): Promise<void> =>
                                            handleDelete(e, activity.id)
                                        }
                                    >
                                        Cancella
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
