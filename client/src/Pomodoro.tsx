import React from "react";
import { useState, ChangeEvent, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { SERVER_API } from "./params/params";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import Pomodoro from "./types/Pomodoro";
import User from "./types/User";

import DatePicker from "react-datepicker"; //to create pomodoro events
import SearchForm from "./SearchForm";
import UserResult from "./types/UserResult";
//import Time from "react-datepicker/dist/time";

enum MESSAGE {
    PRESS_START = "FILL THE SPACES AND PRESS START TO BEGIN!",
    ERROR = "INSERT AN INTEGER NUMBER FOR STUDY TIME, PAUSE TIME AND STUDY CYCLES! (1-99)",
    VOID = "",
    MINUTES = "INSERT THE AMOUNT OF MINUTES OF STUDY (1-3465)",
    HOURS = "INSERT THE AMOUNT OF HOURS OF STUDY (1-57)",
}

enum STATUS {
    BEGIN = "BEGIN SESSION",
    STUDY = "STUDY",
    PAUSE = "PAUSE",
    END = "END OF SESSION",
}

enum Frequency {
    ONCE = "once",
    DAILY = "day",
    WEEKLY = "week",
    MONTHLY = "month",
    YEARLY = "year",
}

type PomodoroData = {
    studyTime: number;
    pauseTime: number;
    cycles: number;
    status: STATUS;
    message: MESSAGE;
    minutes: number;
    seconds: number;
    studying: boolean;
    activeTimer: boolean;
    intervalId?: NodeJS.Timeout;
    totMinutes: number;
    totHours: number;
};

type PomodoroEvent = {
    title: string;
    startTime: Date;
    endTime: Date;
    untilDate: Date | null;
    isInfinite: boolean;
    frequency: Frequency;
    repetitions: number;
    location: string;
};

const initialState: PomodoroData = {
    studyTime: 30,
    pauseTime: 5,
    cycles: 5,
    status: STATUS.BEGIN,
    message: MESSAGE.PRESS_START,
    minutes: 0,
    seconds: 0,
    studying: true,
    activeTimer: false,
    intervalId: undefined,
    totMinutes: 0,
    totHours: 0,
};

const initialPomEvent: PomodoroEvent = {
    title: "Pomodoro Session",
    startTime: new Date(),
    endTime: new Date(),
    untilDate: null,
    isInfinite: false,
    frequency: Frequency.ONCE,
    repetitions: 1,
    location: "",
};

//TODO: aggiornare in tempo reale i pomodori recenti

export default function Pomodoros(): React.JSX.Element {
    // get the value of the query parameters to initialize the pomodoro
    const [searchParams] = useSearchParams();
    const cycles = Number(searchParams.get("cycles")) || initialState.cycles;
    const studyTime =
        Number(searchParams.get("studyTime")) || initialState.studyTime;
    const pauseTime =
        Number(searchParams.get("pauseTime")) || initialState.pauseTime;

    const [data, setData] = useState({
        ...initialState,
        cycles,
        studyTime,
        pauseTime,
    });
    const [pomEvent, setPomEvent] = useState(initialPomEvent);
    const [message, setMessage] = useState("");
    const [tomatoList, setTomatoList] = React.useState([] as Pomodoro[]); //per pomodori recenti
    const [eventList, setEventList] = React.useState<Event[]>([]); //per eventi dello user attuale
    const [initialCycles, setInitialCycles] = React.useState(0);
    const [users, setUsers] = React.useState([] as UserResult[]); // NOTA: uso un array perchè il componente SearchForm ha bisogno di un array di utenti, non un singolo utente
    const [addEvent, setAddEvent] = React.useState(false);
    const [repeatEvent, setRepeatEvent] = React.useState(false);
    const [until, setUntil] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState("Data");




    
    const pomodoroRef = useRef<HTMLDivElement | null>(null);

    const nav = useNavigate();

    //setup per ricevere la durata dell'evento pomodoro cliccando dall'evento sul calendario
    const location = useLocation();

    const getDurationParam = (): number => {
        const params = new URLSearchParams(location.search); // Ottieni i parametri della query
        const duration = params.get("duration"); // Leggi il parametro "duration"
        return duration ? parseInt(duration) : 0; // Restituisci la durata come numero, oppure 0 se non è definita
    };

    const getIdParam = (): string => {
        const params = new URLSearchParams(location.search); // Ottieni i parametri della query
        const id = params.get("id"); // Leggi il parametro "duration"
        return id ? id : ""; // Restituisci la durata come numero, oppure 0 se non è definita
    };

    const duration = getDurationParam(); // Ottieni la durata dal query param

    const id = getIdParam(); // Ottieni l'id dell'evento dal query param

    React.useEffect(() => {
        (async (): Promise<void> => {
            try {
                const res = await fetch(`${SERVER_API}/pomodoro`);
                if (res.status !== 200) {
                    nav("/login");
                }
                // TODO: set session value as response
                const data = (await res.json()) as ResponseBody;

                //console.log(data);

                if (data.status === ResponseStatus.GOOD) {
                    setTomatoList(data.value as Pomodoro[]);
                } else {
                    setMessage("Errore nel ritrovamento dei pomodoro");
                }
            } catch (e) {
                setMessage("Impossibile raggiungere il server");
            }

            //Gestione della durata derivata dall'evento, se arrivo da un evento calendario imposto la sua durata come proposta
            console.log("La durata dell'evento pomodoro è: " + duration);
            if (duration !== 0) {
                proposalsMinutes(duration);
            }
        })();
    }, []);

    function inputCheck(): boolean {
        if (
            data.studyTime <= 0 ||
            data.studyTime > 99 ||
            data.pauseTime <= 0 ||
            data.pauseTime > 99 ||
            data.cycles <= 0 ||
            data.cycles > 99
        ) {
            return false;
        } else {
            return true;
        }
    }
    function playRing(): void {
        const ring = document.getElementById("ring") as HTMLAudioElement;
        if (ring) {
            ring.play();
        }
    }

    function startProcess(): void {
        if (inputCheck()) {
            playRing();
            setInitialCycles(data.cycles);
            clearInterval(data.intervalId);

            const interval = setInterval(() => {
                updateTimer();
            }, 1000);

            setData({
                ...data,
                message: MESSAGE.VOID,
                studying: true,
                activeTimer: true,
                intervalId: interval,
                status: STATUS.STUDY,
                minutes: data.studyTime,
                seconds: 0,
            });
            startAnimation(true);
        } else {
            setData({ ...data, message: MESSAGE.ERROR });
        }
    }

    async function handleSavePomodoroConfig(
        e: React.MouseEvent<HTMLButtonElement>
    ): Promise<void> {
        e.preventDefault();

        try {
            const pomodoroConfig = {
                studyTime: data.studyTime,
                pauseTime: data.pauseTime,
                cycles: data.cycles,
                owner: "",
            };
            console.log("Dati inviati al server:", pomodoroConfig);

            const res = await fetch(`${SERVER_API}/pomodoro`, {
                method: "POST",
                body: JSON.stringify(pomodoroConfig),
                headers: { "Content-Type": "application/json" },
            });

            const resBody = await res.json();

            if (resBody.status === ResponseStatus.GOOD) {
                startProcess();
                //await updateTomatoList();
            } else {
                setMessage("Errore nel salvataggio della configurazione");
            }
        } catch (e) {
            setMessage("Impossibile raggiungere il server");
        }
    }

    //Funzione per aggiornare la lista dei pomodori in tempo reale (non funziona al momento)

    /*const updateTomatoList = async (): Promise<void> => {
        try {
            const response = await fetch(`${SERVER_API}/pomodoro`);
            if (!response.ok) {
                throw new Error('Failed to fetch pomodori');
            }
            const fetchedTomatoes = await response.json();
            setTomatoList(fetchedTomatoes);
        } catch (error) {
            console.error(error);
        }
    };*/

    function stopProcess(): void {
        playRing();
        stopTimer();
        if (duration !== 0 && data.cycles > 0) handleLeftTime(); //Se arrivo da un evento e non ho finito i cicli previsti
    }

    function stopTimer(): void {
        clearInterval(data.intervalId);

        setData((prevData) => {
            return {
                ...prevData,
                intervalId: undefined,
                activeTimer: false,
                status: STATUS.END,
            };
        });

        resetPomodoroColor();
    }

    function handleLeftTime(): void {
        (async (): Promise<void> => {
            try {
                // Dalla durata totale elimino i cicli completati
                const timeToAdd =
                    duration -
                    (data.studyTime + data.pauseTime) *
                    (initialCycles - data.cycles);
                console.log("timeToAdd:", timeToAdd);

                if (timeToAdd >= 30) {
                    const currentUser = await getCurrentUser();
                    const owner = currentUser.value.username;
                    const res = await fetch(
                        `${SERVER_API}/events/owner?owner=${owner}`
                    );
                    const date = await res.json();
                    console.log("Eventi trovati:", data);

                    // Creo una variabile per il pomodoro attuale
                    const currentPomodoro = date.value.find((event: any) => {
                        const eventId = event._id;
                        return eventId === id;
                    });
                    const CurPomStartTime = new Date(currentPomodoro.startTime);
                    const FixedCurPomStartTime = new Date(
                        CurPomStartTime.getTime() +
                        CurPomStartTime.getTimezoneOffset() * 60000
                    );

                    if (date.status === ResponseStatus.GOOD) {
                        setEventList(date.value);
                        console.log(eventList); // Senza questa riga c'è un warning
                        console.log("stampo data.values:", date.value);

                        // Filtra solo gli eventi "Pomodoro Session" successivi all'orario di inizio del pomodoro attuale
                        const eventPomodoro = date.value.find((event: any) => {
                            const eventStartTime = new Date(event.startTime); // Converto l'orario di inizio in Date per la comparazione
                            const eventId = event._id;
                            return (
                                event.title === "Pomodoro Session" &&
                                eventStartTime > FixedCurPomStartTime &&
                                eventId !== id
                            );
                        });

                        if (!eventPomodoro) {
                            console.log(
                                "Nessun evento 'Pomodoro Session' trovato che soddisfi i criteri."
                            );

                            const newStartTime = new Date(
                                currentPomodoro.startTime
                            ); // Usa lo stesso orario di inizio dell'evento attuale
                            const newEndTime = new Date(newStartTime);
                            newEndTime.setMinutes(
                                newEndTime.getMinutes() + timeToAdd
                            ); // Calcolo l'orario di fine evento in base al tempo rimanente

                            // Correggo il fuso orario degli orari
                            const correctedStartTime = new Date(
                                newStartTime.getTime() +
                                newStartTime.getTimezoneOffset() * 60000
                            );
                            const correctedEndTime = new Date(
                                newEndTime.getTime() +
                                newEndTime.getTimezoneOffset() * 60000
                            );

                            // Imposto al giorno successivo il nuovo evento
                            correctedStartTime.setDate(
                                correctedStartTime.getDate() + 1
                            );
                            correctedEndTime.setDate(
                                correctedEndTime.getDate() + 1
                            );

                            const res = await fetch(`${SERVER_API}/events`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                // Nel body utilizzo lo stesso owner, startTime e location della Pomodoro Session attuale
                                body: JSON.stringify({
                                    owner: currentPomodoro.owner,
                                    title: "Pomodoro Session",
                                    startTime: correctedStartTime.toISOString(),
                                    endTime: correctedEndTime.toISOString(),
                                    location: currentPomodoro.location,
                                    frequency: Frequency.ONCE,
                                }),
                            });

                            if (res.ok) {
                                console.log(
                                    "Nuovo evento 'Pomodoro Session' creato con successo."
                                );
                            } else {
                                console.log(
                                    "Errore nella creazione del nuovo evento."
                                );
                            }
                        } else if (eventPomodoro) {
                            console.log(
                                "Trovato un evento 'Pomodoro Session' successivo all'orario attuale:",
                                eventPomodoro
                            );

                            // Aggiungere il tempo rimanente all'evento trovato
                            const updatedEndTime = new Date(
                                eventPomodoro.endTime
                            );
                            updatedEndTime.setMinutes(
                                updatedEndTime.getMinutes() + timeToAdd
                            );

                            // Effettuare una richiesta PUT per aggiornare l'evento
                            const updateRes = await fetch(
                                `${SERVER_API}/events/${eventPomodoro._id}`,
                                {
                                    method: "PUT",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        ...eventPomodoro,
                                        endTime: updatedEndTime,
                                    }),
                                }
                            );
                            if (updateRes.ok) {
                                console.log(
                                    "Evento aggiornato correttamente con il tempo rimanente."
                                );
                            } else {
                                console.log(
                                    "Errore nell'aggiornamento dell'evento."
                                );
                            }
                        }
                    } else {
                        console.log("Errore nel ritrovamento degli eventi");
                    }
                } else {
                    alert(
                        "Il tempo rimanente è minore di 30 minuti, non è possibile creare un nuovo pomodoro."
                    );
                }
            } catch (e) {
                setMessage("Impossibile raggiungere il server");
            }
        })();
    }

    function updateTimer(): void {
        setData((prevData) => {
            let {
                minutes,
                seconds,
                cycles,
                studyTime,
                studying,
                pauseTime,
                status,
                intervalId,
                activeTimer,
            } = prevData;

            seconds -= 1;
            if (seconds < 0) {
                seconds = 59;
                minutes -= 1;
            }

            if (minutes < 0) {
                if (cycles === 0) {
                    clearInterval(prevData.intervalId);

                    intervalId = undefined;
                    activeTimer = false;
                    status = STATUS.END;

                    resetPomodoroColor();
                    minutes = studyTime;
                    seconds = 0;
                } else {
                    if (studying) {
                        // End of study session, enter pause
                        console.log("Start pause session");
                        status = STATUS.PAUSE;
                        studying = false;
                        playRing();
                        startAnimation(false); // Passa false per l'animazione di pausa
                        minutes = pauseTime;
                        seconds = 0;
                        cycles -= 1;
                    } else {
                        // End of pause session, start next study session
                        console.log("Start study session");
                        status = STATUS.STUDY;
                        studying = true;
                        playRing();
                        startAnimation(true); // Passa true per l'animazione di studio
                        minutes = studyTime;
                        seconds = 0;
                    }
                }
            }

            return {
                ...prevData,
                minutes,
                seconds,
                cycles,
                studyTime,
                studying,
                pauseTime,
                status,
                intervalId,
                activeTimer,
            } as PomodoroData;
        });
    }

    function startAnimation(isStudying: boolean): void {
        console.log(isStudying);
        if (pomodoroRef.current) {
            pomodoroRef.current.classList.remove("animate-pomodoro");
            pomodoroRef.current.classList.remove("reverse-animate-pomodoro");
            if (isStudying) {
                pomodoroRef.current.style.animationDuration = `${data.studyTime * 60
                    }s`;
                pomodoroRef.current.classList.add("animate-pomodoro");
            } else {
                pomodoroRef.current.style.animationDuration = `${data.pauseTime * 60
                    }s`;
                pomodoroRef.current.classList.add("reverse-animate-pomodoro");
            }
        }
    }

    function pad(value: number): string {
        return value < 10 ? "0" + value : String(value);
    }

    function resetPomodoroColor(): void {
        if (pomodoroRef.current) {
            pomodoroRef.current.style.animationDuration = `0.1s`;
            pomodoroRef.current.classList.add("animate-pomodoro");

            setTimeout(() => {
                if (pomodoroRef.current) {
                    pomodoroRef.current.classList.remove("animate-pomodoro");
                }
            }, 100);
        }
    }

    function nextPhase(): void {
        setData((prevData) => {
            let {
                minutes,
                seconds,
                cycles,
                studyTime,
                studying,
                pauseTime,
                status,
                intervalId,
                activeTimer,
            } = prevData;

            if (cycles === 0) {
                clearInterval(prevData.intervalId);

                intervalId = undefined;
                activeTimer = false;
                status = STATUS.END;

                resetPomodoroColor();
                minutes = studyTime;
                seconds = 0;
            } else {
                if (studying) {
                    // End of study session, enter pause
                    console.log("Start pause session");
                    status = STATUS.PAUSE;
                    studying = false;
                    playRing();
                    startAnimation(false); // Passa false per l'animazione di pausa
                    minutes = pauseTime;
                    seconds = 0;
                    cycles -= 1;
                } else {
                    // End of pause session, start next study session
                    console.log("Start study session");
                    status = STATUS.STUDY;
                    studying = true;
                    playRing();
                    startAnimation(true); // Passa true per l'animazione di studio
                    minutes = studyTime;
                    seconds = 0;
                }
            }

            return {
                ...prevData,
                minutes,
                seconds,
                cycles,
                studyTime,
                studying,
                pauseTime,
                status,
                intervalId,
                activeTimer,
            } as PomodoroData;
        });
    }

    function nextCycle(): void {
        if (data.studying) {
            nextPhase();
            nextPhase();
        } else {
            nextPhase();
        }
    }

    function repeatCycle(): void {
        setData((prevData) => {
            let { minutes, seconds, cycles, studyTime, studying, status } =
                prevData;

            if (!studying) {
                cycles += 1;
            }
            status = STATUS.STUDY;
            studying = true;
            playRing();
            startAnimation(true); // Passa true per l'animazione di studio
            minutes = studyTime;
            seconds = 0;

            return {
                ...prevData,
                minutes,
                seconds,
                cycles,
                studyTime,
                studying,
                status,
            } as PomodoroData;
        });
    }

    function proposalsMinutes(inputMinutes?: number): void {
        setData((prevData) => {
            let { cycles, studyTime, totMinutes, pauseTime, message } =
                prevData;

            if (inputMinutes !== undefined) {
                totMinutes = inputMinutes;
            }

            if (totMinutes <= 0 || totMinutes > 3465) {
                setData({ ...data, message: MESSAGE.MINUTES });
            } else {
                if (totMinutes % 30 === 0) {
                    studyTime = 25;
                    pauseTime = 5;
                    cycles = Math.floor(totMinutes / 30);
                } else if (totMinutes < 90) {
                    const divBy12 = Math.floor(totMinutes / 12);
                    const decimalMultiplied = (totMinutes / 12 - divBy12) * 100;

                    studyTime =
                        (decimalMultiplied > 50 ? divBy12 + 1 : divBy12) * 5;
                    pauseTime =
                        decimalMultiplied === 0
                            ? divBy12
                            : divBy12 + (decimalMultiplied <= 50 ? 1 : 0);

                    cycles = 2;
                } else if (totMinutes > 90 && totMinutes < 135) {
                    const divBy18 = Math.floor(totMinutes / 18);
                    const decimalMultiplied = (totMinutes / 18 - divBy18) * 100;

                    studyTime =
                        (decimalMultiplied > 50 ? divBy18 + 1 : divBy18) * 5;
                    pauseTime =
                        decimalMultiplied === 0
                            ? divBy18
                            : divBy18 + (decimalMultiplied <= 50 ? 1 : 0);

                    cycles = 3;
                } else if (totMinutes >= 135 && totMinutes < 180) {
                    const divBy24 = Math.floor(totMinutes / 24);
                    const decimalMultiplied = (totMinutes / 24 - divBy24) * 100;

                    studyTime =
                        (decimalMultiplied > 50 ? divBy24 + 1 : divBy24) * 5;
                    pauseTime =
                        decimalMultiplied === 0
                            ? divBy24
                            : divBy24 + (decimalMultiplied <= 50 ? 1 : 0);

                    cycles = 4;
                } else if (totMinutes > 180 && totMinutes < 225) {
                    const divBy30 = Math.floor(totMinutes / 30);
                    const decimalMultiplied = (totMinutes / 30 - divBy30) * 100;

                    studyTime =
                        (decimalMultiplied > 50 ? divBy30 + 1 : divBy30) * 5;
                    pauseTime =
                        decimalMultiplied === 0
                            ? divBy30
                            : divBy30 + (decimalMultiplied <= 50 ? 1 : 0);

                    cycles = 5;
                } else if (totMinutes >= 225 && totMinutes < 270) {
                    const divBy36 = Math.floor(totMinutes / 36);
                    const decimalMultiplied = (totMinutes / 36 - divBy36) * 100;

                    studyTime =
                        (decimalMultiplied > 50 ? divBy36 + 1 : divBy36) * 5;
                    pauseTime =
                        decimalMultiplied === 0
                            ? divBy36
                            : divBy36 + (decimalMultiplied <= 50 ? 2 : 0);

                    cycles = 6;
                } else if (totMinutes > 270 && totMinutes < 315) {
                    const divBy42 = Math.floor(totMinutes / 42);
                    const decimalMultiplied = (totMinutes / 42 - divBy42) * 100;

                    studyTime =
                        (decimalMultiplied > 50 ? divBy42 + 1 : divBy42) * 5;
                    pauseTime =
                        decimalMultiplied === 0
                            ? divBy42
                            : divBy42 + (decimalMultiplied <= 50 ? 2 : 0);

                    cycles = 7;
                } else {
                    studyTime = 30;
                    pauseTime = 5;
                    cycles = Math.floor(totMinutes / 35);
                }
            }
            return {
                ...prevData,
                cycles,
                pauseTime,
                studyTime,
                message,
                totMinutes,
            } as PomodoroData;
        });
    }

    function proposalsHours(): void {
        setData((prevData) => {
            let {
                cycles,
                message,
                studyTime,
                pauseTime,
                totHours,
                totMinutes,
            } = prevData;

            totMinutes = totHours * 60;
            if (totMinutes <= 0 || totMinutes > 3465) {
                setData({ ...data, message: MESSAGE.HOURS });
            } else {
                studyTime = 25;
                pauseTime = 5;
                cycles = Math.floor(totMinutes / 30);
            }
            return {
                ...prevData,
                cycles,
                message,
                studyTime,
                pauseTime,
                totMinutes,
                totHours,
            } as PomodoroData;
        });
    }

    async function handleCreateEvent(
        e: React.MouseEvent<HTMLButtonElement>
    ): Promise<void> {
        e.preventDefault();

        //Validazione dell'input
        if (
            !pomEvent.title ||
            !pomEvent.startTime ||
            !pomEvent.endTime ||
            !pomEvent.location
        ) {
            setMessage("Tutti i campi dell'evento devono essere riempiti!");
            return;
        }

        if (pomEvent.startTime > pomEvent.endTime) {
            setMessage(
                "La data di inizio non può essere collocata dopo la data di fine!"
            );
            return;
        }

        const start = new Date(pomEvent.startTime).getTime();
		const end = new Date(pomEvent.endTime).getTime();

        //l'evento che creo dura almeno 30 minuti?
		if ((end - start) / (1000 * 60) < 30) {
			setMessage("L'evento deve durare almeno 30 minuti");
			return;
		}

        const currentUser = await getCurrentUser();
        const res = await fetch(`${SERVER_API}/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                owner: currentUser.value.username,
                title: pomEvent.title,
                startTime: pomEvent.startTime.toISOString(),
                endTime: pomEvent.endTime.toISOString(),
                untilDate: pomEvent.untilDate,
                isInfinite: pomEvent.isInfinite,
                frequency: pomEvent.frequency,
                repetitions: pomEvent.repetitions,
                location: pomEvent.location,
            }),
        });

        console.log(
            pomEvent.title,
            pomEvent.startTime,
            pomEvent.endTime,
            pomEvent.location
        );

        if (!res.ok) {
            const errorData = await res.json();
            console.error("Error response:", errorData);
            setMessage(
                "Errore durante la creazione dell'evento: " + errorData.message
            );
            return;
        }

        const data: ResponseBody = (await res.json()) as ResponseBody;

        setMessage(data.message || "Undefined error");

        window.location.reload();

        // TODO: send post request to server
        // TODO: handle response
    }

    async function getCurrentUser(): Promise<Promise<any> | null> {
        try {
            const res = await fetch(`${SERVER_API}/users`);
            if (!res.ok) {
                // Controlla se la risposta non è ok
                setMessage("Utente non autenticato");
                return null; // Restituisci null se non autenticato
            }
            console.log(
                "Questa è la risposta alla GET per ottenere lo user",
                res
            );
            const data: User = await res.json();
            console.log("Questo è il json della risposta", data);
            return data;
        } catch (e) {
            setMessage("Impossibile recuperare l'utente corrente");
            return null;
        }
    }

    function handleSelectUser(
        e: React.MouseEvent<HTMLButtonElement>,
        user: UserResult
    ): void {
        e.preventDefault();
        setUsers([user]);
    }

    async function handleSendInvite(
        e: React.MouseEvent<HTMLButtonElement>
    ): Promise<void> {
        e.preventDefault();
        if (!(users.length > 0)) {
            setMessage("Nessun utente selezionato");
            return;
        }

        const res = await fetch(`${SERVER_API}/pomodoro/notifications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                receiver: users[0].id,
                cycles: data.cycles,
                studyTime: data.studyTime,
                pauseTime: data.pauseTime,
            }),
        });

        const resBody: ResponseBody = (await res.json()) as ResponseBody;

        if (resBody.status === ResponseStatus.GOOD) {
            alert("Invito inviato correttamente");
            setUsers([]);
        } else {
            alert(resBody.message);
        }
    }

    function toggleAddEvent(): void {
        setAddEvent(!addEvent);
        setRepeatEvent(false);
    }

    function toggleSelectFrequency(e: React.ChangeEvent<HTMLSelectElement>): void {
        setPomEvent((prevPomEvent) => {
            let {
                frequency,
                untilDate,
            } = prevPomEvent;
            console.log("toggleSelectFrequency", e.target.value);
            const frequenza = e.target.value;
            if (frequenza !== "Once") {
                toggleUntil(frequenza);
            }
            if (frequenza === "Once") {
                frequency = Frequency.ONCE;
                setUntil(false);
            }
            switch (frequenza) {
                case "Daily":
                    frequency = Frequency.DAILY;
                    break;
                case "Weekly":
                    frequency = Frequency.WEEKLY;
                    break;
                case "Monthly":
                    frequency = Frequency.MONTHLY;
                    break;
                case "Yearly":
                    frequency = Frequency.YEARLY;
                    break;
            }
            return {
                ...prevPomEvent,
                frequency,
                untilDate,
            } as PomodoroEvent;
        });
    }

    function toggleUntil(selectedValue: string): void {
		console.log("toggleUntil", selectedValue);
		setUntil(true);

	}

    function toggleSelectUntil(e: React.ChangeEvent<HTMLSelectElement>): void {
        setPomEvent((prevPomEvent) => {
            let {
                isInfinite,
            } = prevPomEvent;
            const valoreSelezionato = e.target.value;
            console.log("toggleSelectUntil", valoreSelezionato);
            switch (valoreSelezionato) {
                case "Data":
                    console.log("selezionato data");
                    isInfinite = false;
                    setSelectedValue("Data");

                    break;
                case "Ripetizioni":
                    console.log("selezionato ripetizioni");
                    isInfinite = false;
                    setSelectedValue("Ripetizioni");
                    break;
                case "Infinito":
                    console.log("selezionato infinito");
                    setSelectedValue("Infinito");
                    isInfinite = true;
                    break;
            }
                return {
                    ...prevPomEvent,
                    isInfinite,
                } as PomodoroEvent;
        });
	}

    return (
        <>
            {message && <div>{message}</div>}

            <audio id="ring" src="/images/ring.mp3"></audio>

            {addEvent && (
                    <div className="overlay">   
                        <div className="create-event-container col-2">
                            <form className="create-event-form-overlay">
                                <h4>Organize your next Pomodoro Session</h4>
                                <button
                                    className="btn btn-primary"
                                    style={{ backgroundColor: "bisque", color: "white", border: "0" }}
                                    onClick={toggleAddEvent}>
                                    Close
                                </button>

                                <label htmlFor="allDayEvent">
                                        <input
                                            type="checkbox"
                                            name="repeatEvent"
                                            onClick={(): void => setRepeatEvent(!repeatEvent)}
                                            style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
                                        />
                                        Evento ripetuto
                                </label>
                                    {repeatEvent && (
                                        <>
                                            <div className="flex" style={{ marginRight: "10px" }}>
                                                Ripeti l'evento
                                                <label htmlFor="repeatEvent">
                                                    <select
                                                        className="btn border"
                                                        name="repetitionType"
                                                        onChange={toggleSelectFrequency}
                                                        style={{ marginLeft: "5px", marginRight: "3px", marginTop: "3px" }}
                                                    >
                                                        <option value="Once">Una volta</option>
                                                        <option value="Daily">Ogni giorno</option>
                                                        <option value="Weekly">Ogni settimana</option>
                                                        <option value="Monthly">Ogni mese </option>
                                                        <option value="Yearly">Ogni anno</option>
                                                    </select>

                                                </label>
                                            </div>



                                            {until && (
                                                <div>
                                                    <div>
                                                        <div className="flex" style={{ marginRight: "10px" }}>
                                                            Fino a
                                                            <select className="btn border" onChange={toggleSelectUntil} defaultValue="Data">
                                                                <option value="Data">Data</option>
                                                                <option value="Ripetizioni">Ripetizioni</option>
                                                                <option value="Infinito">Infinito </option>
                                                            </select>
                                                        </div>

                                                        {selectedValue === "Data" && (
                                                            <DatePicker
                                                                className="btn border"
                                                                name="finoAData"
                                                                selected={pomEvent.untilDate} // Il DatePicker sarà vuoto se untilDate è null
                                                                onChange={(date: Date | null): void => {
                                                                    if (date) {
                                                                        date.setHours(12, 0, 0, 0); // Imposta l'orario a mezzogiorno
                                                                        setPomEvent({
                                                                            ...pomEvent,
                                                                            untilDate: date,
                                                                        });
                                                                    }
                                                                }}
                                                                placeholderText="Seleziona una data"
                                                            />
                                                        )}



                                                        {selectedValue === "Ripetizioni" && (
                                                            <div>
                                                                <input className="btn border" type="number" min="1"
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                                                                        setPomEvent({
                                                                            ...pomEvent,
                                                                            repetitions: Number(e.target.value),
                                                                        });
                                                                        setPomEvent({
                                                                            ...pomEvent,
                                                                            untilDate: null,
                                                                        });

                                                                        if (pomEvent.repetitions < 1 || isNaN(pomEvent.repetitions)) {
                                                                            setPomEvent({
                                                                            ...pomEvent,
                                                                            repetitions: 1,
                                                                        });
                                                                        }
                                                                        console.log("Numero ripetizione dell'evento: ", pomEvent.repetitions);
                                                                    }}>
                                                                </input>
                                                            </div>
                                                        )}


                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                <label htmlFor="startTime">
                                    Data Inizio
                                    <div>
                                        <DatePicker
                                            className="btn border createEventinput"
                                            name="startTime"
                                            selected={pomEvent.startTime}
                                            onChange={(date: Date | null): void => {
                                                if (date) {
                                                    // Aggiorna la data mantenendo l'orario attuale
                                                    const newDate = new Date(
                                                        pomEvent.startTime
                                                    );
                                                    newDate.setFullYear(
                                                        date.getFullYear(),
                                                        date.getMonth(),
                                                        date.getDate()
                                                    );
                                                    setPomEvent({
                                                        ...pomEvent,
                                                        startTime: newDate,
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            className="btn border createEventinput"
                                            type="time"
                                            value={`${pomEvent.startTime
                                                .getHours()
                                                .toString()
                                                .padStart(2, "0")}:${pomEvent.startTime
                                                    .getMinutes()
                                                    .toString()
                                                    .padStart(2, "0")}`}
                                            onChange={(
                                                e: React.ChangeEvent<HTMLInputElement>
                                            ): void => {
                                                const [hours, minutes] =
                                                    e.target.value.split(":");
                                                const newDate = new Date(
                                                    pomEvent.startTime
                                                ); // Crea un nuovo oggetto Date basato su startTime
                                                newDate.setHours(
                                                    Number(hours),
                                                    Number(minutes),
                                                    0,
                                                    0
                                                ); // Imposta l'orario
                                                setPomEvent({
                                                    ...pomEvent,
                                                    startTime: newDate,
                                                }); // Imposta il nuovo oggetto Date
                                            }}
                                        />
                                    </div>
                                </label>

                                <label htmlFor="endTime">
                                    Data Fine
                                    <div>
                                        <DatePicker
                                            className="btn border createEventinput"
                                            name="endTime"
                                            selected={pomEvent.endTime}
                                            onChange={(date: Date | null): void => {
                                                if (date) {
                                                    // Aggiorna la data mantenendo l'orario attuale
                                                    const newDate = new Date(
                                                        pomEvent.endTime
                                                    );
                                                    newDate.setFullYear(
                                                        date.getFullYear(),
                                                        date.getMonth(),
                                                        date.getDate()
                                                    );
                                                    setPomEvent({
                                                        ...pomEvent,
                                                        endTime: newDate,
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            className="btn border createEventinput"
                                            type="time"
                                            value={`${pomEvent.endTime
                                                .getHours()
                                                .toString()
                                                .padStart(2, "0")}:${pomEvent.endTime
                                                    .getMinutes()
                                                    .toString()
                                                    .padStart(2, "0")}`}
                                            onChange={(
                                                e: React.ChangeEvent<HTMLInputElement>
                                            ): void => {
                                                const [hours, minutes] =
                                                    e.target.value.split(":");
                                                const newDate = new Date(
                                                    pomEvent.endTime
                                                );
                                                newDate.setHours(
                                                    Number(hours),
                                                    Number(minutes)
                                                ); // Aggiorna l'orario
                                                setPomEvent({
                                                    ...pomEvent,
                                                    endTime: newDate,
                                                }); // Imposta il nuovo oggetto Date
                                            }}
                                        />
                                    </div>
                                </label>

                                <label htmlFor="location">
                                    Luogo
                                    <div>
                                        <input
                                            className="btn border createEventinput"
                                            type="text"
                                            name="location"
                                            value={pomEvent.location}
                                            onChange={(
                                                e: ChangeEvent<HTMLInputElement>
                                            ): void =>
                                                setPomEvent({
                                                    ...pomEvent,
                                                    location: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </label>

                                <button
                                    className="btn btn-primary"
                                    style={{
                                        backgroundColor: "bisque",
                                        color: "black",
                                        border: "0",
                                    }}
                                    onClick={handleCreateEvent}
                                >
                                    Create Event
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            <div className={addEvent ? "hidden" : "pomodoro-container"}>
                <header>
                    <h1
                        id="title"
                        style={{ color: "black", fontWeight: "bold" }}
                    >
                        POMODORO TIMER
                    </h1>
                </header>

                <button
                    className="add-event-button"
                    onClick={toggleAddEvent}
                    disabled={data.activeTimer}
                >
                    Crea evento Pomodoro
                </button>

                <div className="preview">
                    <div style={{ fontWeight: "bold" }}>POMODORO RECENTI:</div>
                    {tomatoList.slice(-3).map((pomodoro, index) => (
                        <button
                            className="previous-pomodoros"
                            key={index}
                            onClick={(): void =>
                                setData({
                                    ...data,
                                    studyTime: pomodoro.studyTime,
                                    pauseTime: pomodoro.pauseTime,
                                    cycles: pomodoro.cycles,
                                })
                            }
                        >
                            {pomodoro.studyTime} min - {pomodoro.pauseTime} min
                            - {pomodoro.cycles} cicli
                            <br />
                        </button>
                    ))}
                </div>

                <div ref={pomodoroRef} className="pomodoro">
                    <img src="/images/tomato.png" alt="tomato.png" />
                    <div id="timer" className="timer">
                        {data.activeTimer
                            ? `${pad(data.minutes)}:${pad(data.seconds)}`
                            : ""}
                    </div>
                </div>

                <div>
                    <h4
                        style={{
                            margin: "0.5em auto 1em",
                            width: "300px",
                            color: "white",
                            textAlign: "center",
                        }}
                    >
                        {data.status}
                    </h4>

                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <button
                            type="button"
                            className="btn btn-success border"
                            onClick={handleSavePomodoroConfig}
                            disabled={data.activeTimer}
                        >
                            START
                        </button>

                        <button
                            type="button"
                            className="btn btn-danger border"
                            onClick={stopProcess}
                            disabled={!data.activeTimer}
                        >
                            STOP
                        </button>
                    </div>

                    <br />

                    <div>
                        <button
                            type="button"
                            className="btn btn-warning border"
                            onClick={nextPhase}
                            disabled={!data.activeTimer}
                        >
                            NEXT PHASE
                        </button>

                        <button
                            type="button"
                            className="btn btn-warning border"
                            onClick={nextCycle}
                            disabled={!data.activeTimer}
                        >
                            NEXT CYCLE
                        </button>

                        <button
                            type="button"
                            className="btn btn-warning border"
                            onClick={repeatCycle}
                            disabled={!data.activeTimer}
                        >
                            REPEAT CYCLE
                        </button>
                    </div>

                    <p className="paragraph">{data.message}</p>
                </div>

                <div className="pannello studyTime border">
                    <label htmlFor="inputStudy">Study time in minutes</label>
                    <input
                        name="inputStudy"
                        type="number"
                        placeholder="Enter the time"
                        className="inputStudyTime"
                        id="inputStudy"
                        value={data.studyTime}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                            setData({
                                ...data,
                                studyTime: parseInt(e.target.value),
                            })
                        }
                        disabled={data.activeTimer}
                    />
                </div>

                <div className="pannello breakTime border">
                    <label htmlFor="inputPause"> Break time in minutes </label>
                    <input
                        name="inputPause"
                        type="number"
                        placeholder="Enter the time"
                        id="inputPause"
                        value={data.pauseTime}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                            setData({
                                ...data,
                                pauseTime: parseInt(e.target.value),
                            })
                        }
                        disabled={data.activeTimer}
                    />
                </div>

                <div className="pannello studyCycles border">
                    <label htmlFor="inputCycles">
                        {" "}
                        Number of study cycles{" "}
                    </label>
                    <input
                        name="inputCycles"
                        type="number"
                        placeholder="Enter the study cycles"
                        id="inputCycles"
                        value={data.cycles}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                            setData({
                                ...data,
                                cycles: parseInt(e.target.value),
                            })
                        }
                        disabled={data.activeTimer}
                    />
                </div>

                <div className="pannello totMinutes border">
                    <label htmlFor="totMinutes"> Total minutes of study </label>
                    <input
                        name="totMinutes"
                        type="number"
                        placeholder="Enter the total minutes"
                        id="totMinutes"
                        value={data.totMinutes}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                            setData({
                                ...data,
                                totMinutes: parseInt(e.target.value),
                            })
                        }
                        disabled={data.activeTimer}
                    />
                    <button
                        id="minutesButton" //probabilmente non serve l'id
                        type="button"
                        className="btn btn-success"
                        onClick={(): void => proposalsMinutes()}
                        disabled={data.activeTimer}
                    >
                        USE MINUTES
                    </button>
                </div>

                <div className="pannello totHours border">
                    <label htmlFor="totHours"> Total hours of study </label>
                    <input
                        name="totHours"
                        type="number"
                        placeholder="Enter the total hours"
                        id="totHours"
                        value={data.totHours}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                            setData({
                                ...data,
                                totHours: parseInt(e.target.value),
                            })
                        }
                        disabled={data.activeTimer}
                    />
                    <button
                        id="hoursButton" //probabilmente non serve l'id
                        type="button"
                        className="btn btn-success"
                        onClick={proposalsHours}
                        disabled={data.activeTimer}
                    >
                        USE HOURS
                    </button>
                </div>

                

                <div className="send-invite-container">
                    <div>Scegli l'utente al quale inviare la notifica</div>
                    {users.length > 0 && (
                        <div>Utente selezionato: {users[0].username}</div>
                    )}
                    <SearchForm onItemClick={handleSelectUser} list={users} />
                    <button
                        onClick={handleSendInvite}
                        className="btn btn-primary"
                    >
                        Invia Invito
                    </button>
                </div>
            </div>
        </>
    );
}
