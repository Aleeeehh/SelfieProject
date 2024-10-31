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
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]); // Formato YYYY-MM-DD
    const { isLoggedIn } = useAuth();

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setCurrentDate(event.target.value);
    };

    useEffect(() => {
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
    }, []);

    // const toggleMenu = (): void => {
    // 	setShowMenu(!showMenu);
    // };

    // const handleLogout = async (): Promise<void> => {
    // 	await logout();
    // 	setShowMenu(false);
    // };

    return (
        <header
            className=""
            style={{
                display: "flex",
                justifyContent: "space-between",
                margin: "1vw",
            }}
        >
            <a href="/" className="header-home">
                <img src="/images/logo.jpeg" alt="logo.jpeg" />
            </a>
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                }}
            >
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



                {isLoggedIn ? (
                    <>

                        <button
                            className="btn secondary"
                            style={buttonStyle}
                            onClick={(): void =>
                                setShowTimeMachine(!showTimeMachine)
                            }
                        >
                            <i className="bi bi-hourglass-sand" style={{ marginRight: "5px" }}></i> {/* Icona della clessidra */}
                            Time

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
                                        value={currentDate}
                                        onChange={handleDateChange}
                                        style={{ marginLeft: "10px" }}
                                    />

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
                )}
            </div>
        </header>
    );
}
