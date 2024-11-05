import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { SERVER_API } from "./params/params";
import { ResponseStatus } from "./types/ResponseStatus";
import Notification from "./types/Notification";
import User from "./types/User";
import "bootstrap/dist/css/bootstrap.min.css";


const buttonStyle = {
    backgroundColor: "white",
    color: "black",
    borderColor: "gray",
    margin: "3px 6px",
    padding: "4px 6px",
    width: "100px",
    alignSelf: "center",
};

const NOTIFICATION_COUNT = 5;

export default function Header(): React.JSX.Element {
    const [showTimeMachine, setShowTimeMachine] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    // const [noNotifications, setNoNotifications] = useState(false);
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


    // Funzione per pulire le notifiche
    const cleanNotifications = async (): Promise<void> => {
        try {
            const res1 = await fetch(`${SERVER_API}/currentDate`);
            if (!res1.ok) {
                throw new Error("Errore nel recupero della data corrente");
            }
            const data = await res1.json();
            console.log("showTimeMachine:", showTimeMachine);

            // Aggiungi un secondo alla data ottenuta
            const currentDate = new Date(data.currentDate);
            const response = await fetch(`${SERVER_API}/notifications/cleanNotifications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentDate: currentDate }), // Invia la data attuale
            });
            console.log(response); // Log del messaggio di risposta
        } catch (error) {
            console.error("Errore durante la pulizia delle notifiche:", error);
        }
    };

    // useEffect che si attiva quando showNotifications cambia
    useEffect(() => {
        if (showNotifications) {
            cleanNotifications(); // Chiama la funzione per pulire le notifiche
        }
    }, [showNotifications]); // Dipendenza da showNotifications


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

    /* useEffect(() => {
         // Resetta noNotifications quando le notifiche cambiano
         if (notifications && notifications.length > 0) {
             setNoNotifications(false);
         }
     }, [notifications]);
     */

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
            cleanNotifications();

        } catch (error) {
            console.error("Errore nella richiesta:", error);
        }
        /*
                try {
                    const res = await fetch(`${SERVER_API}/notifications/deleteNotification`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ notification_id: notificationId }),
                    });
                    console.log("Risposta dalla deleteNotification:", res);
                } catch (error) {
                    console.error("Errore nella richiesta:", error);
                }
                    */
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
        console.log("Notifications:", notifications);
        return notifications.some((notification: Notification) => {
            if (notification && notification.type === "event" && notification.read === false) {
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

    function toggleDropdown(): void {
        setShowDropdown(prevState => !prevState);
        console.log("showDropdown:", showDropdown);
    }


    return (
        <header className="header-container">
            {/*Parte sinistra dell'header*/}
            <div className="link-container">
                <a href="/">
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

            <div className="dropdown-container">
                <a href="/">
                    <img src="/images/logo.jpeg" alt="logo.jpeg" />
                </a>
                <button
                    type="button"
                    className="btn secondary"
                    style={{ ...buttonStyle, width: "80px", position: "relative" }}
                    onClick={toggleDropdown}
                >
                    Menù
                    <ul className="dropdown-menu"
                        style={{
                            display: (showDropdown ? "block" : "none"),
                            position: "absolute",
                            top: "100%",
                            left: "0",
                            backgroundColor: "white",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                            listStyle: "none",
                            padding: "0",
                            margin: "0",
                            width: "120px",
                            zIndex: "100",
                        }}
                    >
                        <li><a href="/calendar">Calendario</a></li>
                        <li><a href="/pomodoro">Pomodoro</a></li>
                        <li><a href="/notes">Note</a></li>
                        <li><a href="/projects">Progetti</a></li>
                    </ul>
                </button>
            </div>



            {
                isLoggedIn ? (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            width: "50%",
                            alignItems: "center"
                        }}
                    >
                        {currentDate && ((
                            <>
                                <span
                                    className="btn secondary date-button">
                                    {formatDate(currentDate)}
                                </span>
                                <span
                                    className="btn secondary date-button">
                                    {formatDateHours(currentDate)}
                                </span>
                            </>
                        ))}

                        <button
                            className="btn secondary"
                            style={{ ...buttonStyle, width: "50px" }}
                            onClick={(): void => setShowTimeMachine(!showTimeMachine)}
                        >
                            <i className="fas fa-hourglass" style={{ marginRight: "5px" }}></i>
                            {/* Icona della clessidra */}
                        </button>

                        {showTimeMachine && (
                            <>
                                <div className="time-machine-form">

                                    <label htmlFor="dateInput">Cambia la data odierna:
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
                                    </label>

                                    <label htmlFor="timeInput">Cambia l'orario:
                                        <input className="btn secondary"
                                            type="time"
                                            id="timeInput"
                                            value={currentDate ? currentDate.toTimeString().split(' ')[0].slice(0, 5) : ''} // Imposta l'orario attuale come valore predefinito
                                            onChange={(event): void => {
                                                const timeValue = event.target.value;

                                                // Controlla se il valore è vuoto
                                                if (timeValue) {
                                                    const timeParts = timeValue.split(':');
                                                    const newDate = new Date(currentDate);
                                                    newDate.setHours(Number(timeParts[0]), Number(timeParts[1]));
                                                    setCurrentDate(newDate); // Aggiorna lo stato con la nuova data e orario
                                                } else {
                                                    // Se il valore è vuoto, non fare nulla o gestisci come preferisci
                                                    console.warn("Orario non valido");
                                                }
                                            }}
                                            style={{ marginLeft: "10px" }}
                                        />
                                    </label>

                                    <button className="btn secondary"
                                        onClick={(): void => {
                                            postCurrentDate(currentDate); // Chiama postCurrentDate con la data e orario selezionati
                                            setShowTimeMachine(false); // Nascondi il time machine
                                        }} style={buttonStyle}
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
                                        style={buttonStyle}
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
                                width: "50px"
                            }}
                            onClick={(): void => setShowNotifications(!showNotifications)}
                        >
                            <i className="fas fa-bell" />
                            {hasEventNotifications() && ( // Mostra il pallino solo se ci sono notifiche di tipo "event"
                                <span className="notification-dot" />
                            )}
                        </button>
                        {showNotifications && (
                            <>
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "60px",
                                        right: "40px",
                                        backgroundColor: "white",
                                        border: "1px solid gray",
                                        padding: "10px",
                                        zIndex: "1",
                                        borderRadius: "10px",
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

                                                            {notification.message}
                                                            <button className="btn secondary"
                                                                style={{ background: 'none', cursor: 'pointer' }}
                                                                onClick={(): void => {
                                                                    if (notification.id) { // Controlla se notification.id è definito
                                                                        handleReadNotification(notification.id);
                                                                    } else {
                                                                        console.error("ID notifica non definito");
                                                                    }
                                                                }}
                                                            >
                                                                <i className="fas fa-check" style={{ color: 'green', fontSize: '20px' }}></i> {/* Icona di tick */}
                                                            </button>
                                                        </div>
                                                    );
                                                }
                                            }
                                            return null
                                        })
                                    ) : (
                                        (
                                            <div>
                                                <p style={{ fontWeight: "bold" }}>Non ci sono notifiche</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </>
                        )
                        }
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
                    </div >
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

        </header >
    );
}
