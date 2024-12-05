import React, { useRef } from "react";
import { SERVER_API } from "./lib/params";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import { useNavigate } from "react-router-dom";
// import UserResult from "./types/UserResult";
import SearchForm from "./SearchForm";
import type Chat from "./types/Chat";
// import Message from "./types/Message";

function MessageHub(): React.JSX.Element {
	const [activeChat, setActiveChat] = React.useState({} as Chat);
	const [chatList, setChatList] = React.useState([] as Chat[]);
	const [input, setInput] = React.useState("");
	const [addingChat, setAddingChat] = React.useState(false);
	const [deletingChat, setDeletingChat] = React.useState(false);
	const loggedUser = {
		username: localStorage.getItem("loggedUserName"),
		id: localStorage.getItem("loggedUserId"),
	};

	//const [message, setMessage] = React.useState("");
	const [listMessage, setListMessage] = React.useState("");
	const [chatMessage, setChatMessage] = React.useState("");

	const nav = useNavigate();

	const lastMessageRef = useRef<HTMLDivElement | null>(null);

	React.useEffect(() => {
		if (lastMessageRef.current) {
			lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [activeChat]);

	async function getAllChats(): Promise<void> {
		try {
			const res = await fetch(`${SERVER_API}/chats`);
			if (res.status !== 200) {
				nav("/login");
			}

			const resBody = (await res.json()) as ResponseBody;

			if (resBody.status === ResponseStatus.GOOD) {
				setChatList(resBody.value);
			} else {
			}
		} catch (e) {
			console.log("Impossibile raggiungere il server");
		}
	}

	React.useEffect(() => {
		getAllChats();
	}, []);

	async function handleSendMessage(): Promise<void> {
		try {
			const res = await fetch(`${SERVER_API}/chats/${activeChat.id}/messages`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					text: input,
				}),
			});
			const resBody = (await res.json()) as ResponseBody;
			if (res.status === 200) {
				setInput("");
				const updateRes = await fetch(`${SERVER_API}/chats`);

				const updatedResBody = (await updateRes.json()) as ResponseBody;
				console.log(updatedResBody);
				if (updateRes.status === 200) {
					const chats = updatedResBody.value as Chat[];
					setActiveChat(chats.find((chat) => chat.id === activeChat.id)!);
				} else {
					setChatMessage("Errore nell'aggiornamento della chat; ricarica la pagina");
				}
			} else {
				setChatMessage("Impossibile inviare il messaggio: " + resBody.message);
			}
		} catch (e) {
			setChatMessage("Impossibile raggiungere il server");
		}
	}

	/*React.useEffect(() => {
        if (activeChat.id) {
            console.log("Inizio polling per chat:", activeChat.id);
            const interval = setInterval(() => {
                console.log("Polling in esecuzione...");
                updateChatMessages();
            }, 5000);
            return () => {
                console.log("Interrompo polling per chat:", activeChat.id);
                clearInterval(interval);
            };
        }
        else {
            return;
        }
    }, [activeChat]);
    
    
    async function updateChatMessages(): Promise<void> {
        try {
            const res = await fetch(`${SERVER_API}/chats/${activeChat.id}`);
            if (res.status === 200) {
                const resBody = (await res.json()) as ResponseBody;
                if (resBody.status === ResponseStatus.GOOD) {
                    setActiveChat(resBody.value as Chat);
                } else {
                    setMessage("Errore aggiornando i messaggi.");
                }
            } else {
                setMessage("Errore di connessione.");
            }
        } catch (error) {
            setMessage("Impossibile raggiungere il server.");
        }
    }*/

	async function addNewChat(
		e: React.ChangeEvent<HTMLSelectElement>,
		username: string
	): Promise<void> {
		e.preventDefault();

		try {
			const res = await fetch(`${SERVER_API}/chats`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					firstUser: loggedUser?.username,
					secondUser: username,
					type: "private",
				}),
			});

			console.log(loggedUser);
			const resBody = (await res.json()) as ResponseBody;

			if (res.status === 200) {
				console.log(resBody);

				// Get updated chat list

				const chats = await fetch(`${SERVER_API}/chats`);
				const resBody2 = (await chats.json()) as ResponseBody;
				if (res.status === 200) {
					setChatList(resBody2.value as Chat[]);
					setActiveChat(resBody2.value[0]);
				} else {
					setListMessage("Impossibile recuperare le chat: " + resBody.message);
				}
			} else {
				setChatMessage("Impossibile creare la chat: " + resBody.message);
			}
		} catch (e) {
			setListMessage("Impossibile raggiungere il server");
		}
	}

	async function deleteChat(
		e: React.ChangeEvent<HTMLSelectElement>,
		username: string
	): Promise<void> {
		e.preventDefault();

		const foundChat = chatList.find(
			(chat) => chat.firstUser === username || chat.secondUser === username
		);

		if (!foundChat) {
			alert("Chat con utente '" + username + "' non trovata, impossibile eliminare");
		}

		try {
			const res = await fetch(`${SERVER_API}/chats/${foundChat?.id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const resBody = (await res.json()) as ResponseBody;

			if (res.status === 200) {
				console.log(resBody);

				// Aggiorna la lista delle chat
				const chats = await fetch(`${SERVER_API}/chats`);
				const resBody2 = (await chats.json()) as ResponseBody;
				if (res.status === 200) {
					setChatList(resBody2.value as Chat[]);
					setActiveChat(resBody2.value[0]);
				} else {
					setListMessage("Impossibile recuperare le chat: " + resBody.message);
				}
			} else {
				setListMessage("Impossibile eliminare la chat: " + resBody.message);
			}
		} catch (e) {
			setListMessage("Impossibile raggiungere il server");
		}
	}

	return (
		<>
			<div className="chat-background">
				<div className="chat-page-container">
					<div className="chat-list-container">
						{listMessage && <div className="error-message">{listMessage}</div>}
						<button
							className="create-chat-button"
							onClick={(): void => setAddingChat(true)}>
							Crea una nuova chat
						</button>
						{addingChat && (
							<>
								<SearchForm
									onItemClick={(e, user): void => {
										addNewChat(e, user);
									}}
									list={[]}
								/>
								<button
									className="chat-close-button"
									onClick={(): void => setAddingChat(false)}>
									Chiudi
								</button>
							</>
						)}
						{chatList.map((chat) => (
							<div className="chat-list-item" key={chat.id}>
								<div className="chat-user">
									{chat.secondUser === loggedUser?.username
										? chat.firstUser
										: chat.secondUser}
								</div>
								<button
									className="chat-select-button"
									onClick={(): void => setActiveChat(chat)}>
									Chat
								</button>
							</div>
						))}
						<button
							className="delete-chat-button"
							onClick={(): void => setDeletingChat(true)}>
							Elimina una chat
						</button>
						{deletingChat && (
							<>
								<SearchForm
									onItemClick={(e, user: string): void => {
										deleteChat(e, user);
									}}
									list={[]}
								/>
								<button
									className="chat-close-button"
									onClick={(): void => setDeletingChat(false)}>
									Chiudi
								</button>
							</>
						)}
					</div>
					<div className="chat-container">
						<div className="chat-header">
							{activeChat &&
								activeChat.firstUser &&
								activeChat.secondUser &&
								(activeChat.firstUser === loggedUser?.username
									? activeChat.secondUser
									: activeChat.firstUser)}
						</div>
						<div className="chat-message-list">
							{activeChat &&
								activeChat.messageList &&
								activeChat.messageList.map((message, index) => (
									<div
										className={`chat-message ${
											message.username === loggedUser?.username
												? "message-sent"
												: "message-received"
										}`}
										key={message.id}
										ref={
											index === activeChat.messageList.length - 1
												? lastMessageRef
												: null
										}>
										<div className="message-text">{message.text}</div>
										<div className="message-info">
											<span>from {message.username}</span>
											<span>
												at{" "}
												{message.createdAt
													? new Date(
															message.createdAt
													  ).toLocaleTimeString("it-IT", {
															hour: "2-digit",
															minute: "2-digit",
													  })
													: "N/A"}
											</span>
										</div>
									</div>
								))}
						</div>
						{chatMessage && (<div className="error-message">{chatMessage}</div>)}
						<div className="chat-input-container">
							<input
								className="message-input"
								value={input}
								onChange={(e): void => setInput(e.target.value)}
							/>
							<button
								className="send-button"
								onClick={handleSendMessage}
								disabled={!input}>
								Invia
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default MessageHub;
