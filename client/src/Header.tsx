import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { SERVER_API } from "./params/params";
import { ResponseStatus } from "./types/ResponseStatus";
import Notification from "./types/Notification";


const buttonStyle = {
    backgroundColor: "white",
    color: "black",
    borderColor: "gray",
    margin: "auto 0.5em",
    width: "100px",
    alignSelf: "center",
};

const NOTIFICATION_COUNT = 5;

export default function Header(): React.JSX.Element {
    const [showTimeMachine, setShowTimeMachine] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([] as Notification[]);
    const [currentDate, setCurrentDate] = useState(new Date()); // Formato YYYY-MM-DD
    const { isLoggedIn } = useAuth();

    /* const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setCurrentDate(event.target.value);
    };*/

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('it-IT', { // Formato italiano
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });
    };

    const fetchCurrentDate = async (): Promise<void> => {
        try {
            const response = await fetch(`${SERVER_API}/currentDate`);
            if (!response.ok) {
                throw new Error("Errore nel recupero della data corrente");
            }
            const data = await response.json();
            setCurrentDate(new Date(data.currentDate)); // Imposta la data corrente
            postCurrentDate(new Date(data.currentDate)); // Invia la data corrente al server
        } catch (error) {
            console.error("Errore durante il recupero della data corrente:", error);
        }
    };


    async function postCurrentDate(data: Date): Promise<void> {
        try {
            //console.log(currentDate);
            // setCurrentDate(data);
            const response = await fetch(`${SERVER_API}/currentDate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newDate: data }), // Invia la data corrente
            });

            if (!response.ok) {
                throw new Error("ERRORE NELLA RICHIESTA POST DI CURRENTDATE NELL'HEADER");
            }

            //  const data = await response.json();
            //console.log( data);

            const getResponse = await fetch(`${SERVER_API}/currentDate`);
            if (!getResponse.ok) {
                throw new Error("ERRORE NELLA RICHIESTA GET DI CURRENTDATE NELL'HEADER");
            }

        } catch (error) {
            console.error("Errore durante l'invio della data corrente:", error);
        }
    };

    useEffect(() => {
        // Funzione per inviare la richiesta POST
        fetchCurrentDate(); // Chiama la funzione per ottenere la data corrente


        postCurrentDate(new Date()); // Chiama la funzione per inviare la richiesta POST

        // Fetch delle notifiche
        fetch(`${SERVER_API}/notifications?count=${NOTIFICATION_COUNT}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Notifications:", data);
                if (data.status === ResponseStatus.GOOD) {
                    setNotifications(data.value);
                } else {
                    console.error("Error:", data.message);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }, []); // L'array vuoto assicura che l'effetto venga eseguito solo al montaggio



    return (
        <header
            className=""
            style={{
                display: "flex",
                justifyContent: "space-between",
                margin: "1vw",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    width: "100%",

                }}
            >
                <a href="/" className="header-home">
                    <img src="/images/logo.jpeg" alt="logo.jpeg" />
                </a>


                <a
                    className="btn secondary"
                    style={buttonStyle}
                    href="/calendar"
                >
                    Calendario
                </a>
                <a
                    className="btn secondary"
                    style={buttonStyle}
                    href="/pomodoro"
                >
                    Pomodoro
                </a>
                <a className="btn secondary" style={buttonStyle} href="/notes">
                    Note
                </a>
                <a
                    className="btn secondary"
                    style={buttonStyle}
                    href="/projects"
                >
                    Progetti
                </a>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                }}
            >
                {currentDate && (
                    <button className="btn secondary" style={{ fontWeight: 'bold', fontSize: '24px', fontFamily: 'Times New Roman, Times, serif', alignItems: "center" }}>
                        {formatDate(currentDate)}
                    </button>
                )}




                {isLoggedIn ? (
                    <>

                        <button
                            className="btn secondary"
                            style={buttonStyle}
                            onClick={(): void =>
                                setShowTimeMachine(!showTimeMachine)
                            }
                        >
                            <i className="fas fa-hourglass" style={{ marginRight: "5px" }}></i> {/* Icona della clessidra */}


                        </button>

                        {showTimeMachine && (
                            <>
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "55px",
                                        right: "200px",
                                        backgroundColor: "white",
                                        border: "1px solid gray",
                                        padding: "10px",
                                        zIndex: "1",
                                    }}
                                >
                                    <label htmlFor="dateInput">Cambia la data odierna:</label>
                                    <input
                                        type="date"
                                        id="dateInput"
                                        value={currentDate ? currentDate.toISOString().split('T')[0] : ''} // Assicurati che currentDate sia valido
                                        onChange={(event): void => {
                                            const inputDate = event.target.value;
                                            const parsedDate = new Date(inputDate);

                                            // Controlla se la data è valida
                                            if (isNaN(parsedDate.getTime())) {
                                                console.error("Data non valida:", inputDate);
                                                return; // Non procedere se la data non è valida
                                            }

                                            setCurrentDate(parsedDate); // Aggiorna lo stato solo se la data è valida
                                        }}
                                        style={{ marginLeft: "10px" }}
                                    />

                                    <label htmlFor="timeInput">Cambia l'orario:</label>
                                    <input className="btn secondary"
                                        type="time"
                                        id="timeInput"
                                        onChange={(event): void => {
                                            const timeParts = event.target.value.split(':');
                                            const newDate = new Date(currentDate);
                                            newDate.setHours(Number(timeParts[0]), Number(timeParts[1]));
                                            setCurrentDate(newDate); // Aggiorna lo stato con la nuova data e orario
                                        }}
                                        style={{ marginLeft: "10px" }}
                                    />

                                    <button className="btn secondary"
                                        onClick={(): void => {
                                            postCurrentDate(currentDate); // Chiama postCurrentDate con la data e orario selezionati
                                            setShowTimeMachine(false); // Nascondi il time machine
                                        }} style={{ marginLeft: "10px" }}
                                    >
                                        Imposta Data
                                    </button>

                                    <button className="btn secondary"
                                        onClick={async (): Promise<void> => {
                                            const newDate = new Date(); // Ottieni la data corrente
                                            await postCurrentDate(newDate); // Chiama postCurrentDate con la data corrente
                                            setCurrentDate(newDate); // Aggiorna lo stato con la nuova data
                                            setShowTimeMachine(false); // Nascondi il time machine
                                        }}
                                        style={{ marginLeft: "10px" }}
                                    >
                                        Resetta Data
                                    </button>

                                </div>


                            </>


                        )}


                        <button
                            className="btn secondary"
                            style={buttonStyle}
                            onClick={(): void =>
                                setShowNotifications(!showNotifications)
                            }
                        >
                            <i className="fas fa-bell" />
                        </button>



                        {showNotifications && (
                            <>
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "55px",
                                        right: "40px",
                                        backgroundColor: "white",
                                        border: "1px solid gray",
                                        padding: "10px",
                                        zIndex: "1",
                                    }}
                                >
                                    {notifications && notifications.length > 0 ? (
                                        notifications.map((notification, index) => {
                                            // TODO: Differentiate by type
                                            if (notification.type === "pomodoro") {
                                                const nCycles =
                                                    notification.data.cycles || 5;

                                                const nStudyTime =
                                                    notification.data.studyTime ||
                                                    25;

                                                const nPauseTime =
                                                    notification.data.pauseTime ||
                                                    5;
                                                return (
                                                    <a
                                                        href={`/pomodoro?cycles=${nCycles}&studyTime=${nStudyTime}&pauseTime=${nPauseTime}`}
                                                    >
                                                        <div key={index}>
                                                            <p>
                                                                Hai ricevuto un
                                                                invito da{" "}
                                                                {
                                                                    notification.sender
                                                                }{" "}
                                                                per un pomodoro!
                                                            </p>
                                                            <p>
                                                                {notification.type}{" "}
                                                                -{" "}
                                                                {notification.sentAt.toString()}
                                                            </p>
                                                        </div>
                                                    </a>
                                                );
                                            } else {
                                                return (
                                                    <div key={index}>
                                                        <p>
                                                            {notification.type} -{" "}
                                                            {notification.sentAt.toString()}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                        })
                                    ) : (
                                        <div>
                                            <p>No notifications</p>
                                        </div>
                                    )}
                                </div>


                            </>


                        )}




                        <div
                            style={{
                                ...buttonStyle,
                                display: "flex",
                                width: undefined,
                                justifyContent: "flex-end",
                                alignItems: "center",
                            }}
                        >
                            <a
                                href="/profile"
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    backgroundColor: "#007bff",
                                    border: "none",
                                    cursor: "pointer",
                                    alignItems: "center",
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <span style={{ color: "white" }}>U</span>
                            </a>
                        </div>

                    </>
                ) : (
                    <a
                        href="/login"
                        className="btn secondary"
                        style={{
                            ...buttonStyle,
                            backgroundColor: "green",
                            color: "white",
                        }}
                    >
                        Login
                    </a>
                )
                }
            </div>

        </header >
    );
}
