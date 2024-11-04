import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { SERVER_API } from "./params/params";
import { ResponseStatus } from "./types/ResponseStatus";
import Notification from "./types/Notification";
import User from "./types/User";


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
    const [user, setUser] = useState(null);
    //const [isChangingDate, setIsChangingDate] = useState(false);
    const { isLoggedIn } = useAuth();

    /* const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setCurrentDate(event.target.value);
    };*/

    const formatDate = (date: Date): string => {
        return date.toLocaleString('it-IT', { // Formato italiano
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',

            hour12: false // Imposta su false per il formato 24 ore
        });
    };
    const formatDateHours = (date: Date): string => {
        return date.toLocaleString('it-IT', { // Formato italiano
            hour: 'numeric',
            minute: 'numeric',

        });
    };

    const fetchCurrentDate = async (): Promise<void> => {
        try {
            const response = await fetch(`${SERVER_API}/currentDate`);
            if (!response.ok) {
                throw new Error("Errore nel recupero della data corrente");
            }
            const data = await response.json();
            console.log("showTimeMachine:", showTimeMachine);

            // Aggiungi un secondo alla data ottenuta
            const newDate = new Date(data.currentDate);
            newDate.setSeconds(newDate.getSeconds() + 1); // Aggiungi un secondo

            // Imposta la data corrente
            setCurrentDate(newDate); // Imposta la data corrente

            // Invia la nuova data al server
            await postCurrentDate(newDate); // Invia la nuova data al server

            fetchNotifications(); //ogni volta che modifico la data corrente, ottieni le notifiche
            hasEventNotifications(); //aggiorna il fatto che ci siano notifiche o meno di tipo event
            console.log("NOTIFICHE:", notifications);
        } catch (error) {
            console.error("Errore durante il recupero della data corrente:", error);
        }
    };

    const handleReadNotification = async (notificationId: string): Promise<void> => {
        try {
            const res = await fetch(`${SERVER_API}/notifications/${notificationId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ read: "true" }), // Imposta il campo read a true
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Errore durante l'aggiornamento della notifica:", errorData);
            } else {
                console.log(`Notifica con ID ${notificationId} aggiornata con successo.`);
                // Aggiorna lo stato locale se necessario
                // Ad esempio, puoi aggiornare l'array delle notifiche per riflettere il cambiamento
            }
        } catch (error) {
            console.error("Errore nella richiesta:", error);
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

    //ritorna true se ci sono notifiche di tipo event che sono già passate
    function hasEventNotifications(): boolean {
        return notifications.some((notification: Notification) => {
            if (notification.type === "event" && notification.read === false) {
                const eventDate = new Date(notification.data.date); // Assicurati che notification.data.date sia un formato valido
                return eventDate < currentDate; // Controlla se la data dell'evento è inferiore a currentDate
            }
            return false; // Restituisci false se non è di tipo "event"
        });
    }


    async function getCurrentUser(): Promise<Promise<any> | null> {
        try {
            const res = await fetch(`${SERVER_API}/users`);
            if (!res.ok) { // Controlla se la risposta non è ok
                return null; // Restituisci null se non autenticato
            }
            //console.log("Questa è la risposta alla GET per ottenere lo user", res);
            const data: User = await res.json();
            //console.log("Questo è il json della risposta", data);
            return data;
        } catch (e) {
            return null;
        }
    }

    const fetchNotifications = async (): Promise<void> => {
        try {
            const response = await fetch(`${SERVER_API}/notifications?count=${NOTIFICATION_COUNT}`);
            const data = await response.json();
            console.log("Notifications:", data);
            if (data.status === ResponseStatus.GOOD) {
                setNotifications(data.value);
            } else {
                console.error("Error:", data.message);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    useEffect(() => {
        const fetchData = async (): Promise<void> => {
            await postCurrentDate(currentDate); // invia la data corrente al server
            const currentUser = await getCurrentUser();
            console.log("Questo è il currentUser:", currentUser);
            setUser(currentUser.value._id);
            console.log("ID USER ATTUALE:", user); // Usa currentUser.value.id direttamente
            console.log("Questo è il currentUser.value:", currentUser.value);
        };

        fetchData(); // Chiama la funzione asincrona
    }, []);

    useEffect(() => {
        fetchNotifications(); // Fetch delle notifiche

        // Aggiorna la currentDate della Home ogni secondo
        const intervalId = setInterval(() => {
            if (!showTimeMachine) {
                fetchCurrentDate(); // Chiama la funzione per ottenere la data corrente solo se non stai usando il time machine
            }
        }, 1000);

        return () => clearInterval(intervalId); // Pulizia dell'intervallo al momento dello smontaggio
    }, [showTimeMachine]); // Aggiungi showTimeMachine come dipendenza

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

                {currentDate && (
                    <button className="btn secondary" style={{ fontWeight: 'bold', fontSize: '24px', fontFamily: 'Times New Roman, Times, serif', alignItems: "center" }}>{formatDateHours(currentDate)}</button>
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
                                        value={currentDate ? currentDate.toTimeString().split(' ')[0].slice(0, 5) : ''} // Imposta l'orario attuale come valore predefinito
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
                            style={{
                                ...buttonStyle,
                                position: "relative", // Posizionamento relativo per il pallino
                            }}
                            onClick={(): void =>
                                setShowNotifications(!showNotifications)
                            }
                        >
                            <i className="fas fa-bell" />
                            {hasEventNotifications() && ( // Mostra il pallino solo se ci sono notifiche di tipo "event"
                                <span
                                    style={{
                                        position: "absolute",
                                        top: "-5px", // Posiziona il pallino sopra il pulsante
                                        right: "-5px", // Posiziona il pallino a destra del pulsante
                                        width: "15px",
                                        height: "15px",
                                        borderRadius: "50%",
                                        backgroundColor: "#FF007F", // Colore del pallino
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.7rem",
                                        border: "1px solid white", // Aggiungi un bordo bianco per migliorare la visibilità
                                    }}
                                />
                            )}
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
                                        console.log("NOTIFICHE:", notifications),
                                        notifications.map((notification, index) => {

                                            // TODO: Differentiate by type
                                            if (notification.type === "pomodoro") {
                                                const nCycles = notification.data.cycles || 5;
                                                const nStudyTime = notification.data.studyTime || 25;
                                                const nPauseTime = notification.data.pauseTime || 5;
                                                return (
                                                    <a
                                                        href={`/pomodoro?cycles=${nCycles}&studyTime=${nStudyTime}&pauseTime=${nPauseTime}`}
                                                        key={index} // Sposta la chiave qui
                                                    >
                                                        <div>
                                                            <p>
                                                                Hai ricevuto un invito da {notification.sender} per un pomodoro!
                                                            </p>
                                                            <p>
                                                                {notification.type} - {notification.sentAt.toString()}
                                                            </p>
                                                        </div>
                                                    </a>
                                                );
                                            }
                                            else if (notification.type === "event" && notification.receiver === user && notification.read === false) {
                                                const eventDate = new Date(notification.data.date); // Crea un oggetto Date

                                                //mostra la notifica solo se la data corrente è successiva alla data della notifica
                                                if (eventDate < currentDate) {
                                                    return (
                                                        <div key={index}>

                                                            <p>
                                                                Data odierna: {currentDate.toLocaleString('it-IT', {
                                                                    day: 'numeric',
                                                                    month: 'numeric',
                                                                    year: 'numeric',
                                                                    hour: 'numeric',
                                                                    minute: 'numeric',
                                                                    hour12: false // Imposta su false per il formato 24 ore
                                                                })}:
                                                                Data notifica: {eventDate.toLocaleString('it-IT', {
                                                                    day: 'numeric',
                                                                    month: 'numeric',
                                                                    year: 'numeric',
                                                                    hour: 'numeric',
                                                                    minute: 'numeric',
                                                                    hour12: false // Imposta su false per il formato 24 ore
                                                                })}
                                                                {notification.message}
                                                                <button className="btn secondary"
                                                                    style={{ background: 'none', cursor: 'pointer' }}
                                                                    onClick={(): void => {
                                                                        handleReadNotification(notification.id);
                                                                    }}
                                                                >
                                                                    <i className="fas fa-check" style={{ color: 'green', fontSize: '20px' }}></i> {/* Icona di tick */}
                                                                </button>
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                else return (
                                                    <div>
                                                        <p>No notifications</p>
                                                    </div>
                                                );

                                            }
                                            // Restituisci un elemento vuoto se non ci sono condizioni soddisfatte
                                            else {
                                                return (
                                                    <div>
                                                        <p>No notifications</p>
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
