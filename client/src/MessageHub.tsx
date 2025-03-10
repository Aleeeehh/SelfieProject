import React, { useRef } from "react";
import { SERVER_API } from "./lib/params";
import { ResponseBody } from "./types/ResponseBody";
import { ResponseStatus } from "./types/ResponseStatus";
import SearchForm from "./SearchForm";
import type Chat from "./types/Chat";

function MessageHub(): React.JSX.Element {
	const [activeChat, setActiveChat] = React.useState({} as Chat);
	const [chatList, setChatList] = React.useState([] as Chat[]);
	const [input, setInput] = React.useState("");
	const [addingChat, setAddingChat] = React.useState(false);
	const loggedUser = {
		username: localStorage.getItem("loggedUserName"),
		id: localStorage.getItem("loggedUserId"),
	};

	const [listMessage, setListMessage] = React.useState("");
	const [chatMessage, setChatMessage] = React.useState("");

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
			} else {
				const resBody = (await res.json()) as ResponseBody;

				if (resBody.status === ResponseStatus.GOOD) {
					setChatList(resBody.value);
					if (resBody.value.length > 0) {
						setActiveChat(resBody.value[0]);
					}
				} else {
				}
			}
		} catch (e) {
			console.log("Impossibile raggiungere il server");
		}
	}

	React.useEffect(() => {
		getAllChats();
		console.log(chatMessage);
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

	async function deleteChat(e: React.MouseEvent<HTMLButtonElement>, chat: Chat): Promise<void> {
		e.preventDefault();

		if (!chat.id) {
			console.log("Chat non trovata");
			return;
		}

		try {
			const res = await fetch(`${SERVER_API}/chats/${chat?.id || "null"}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const resBody = (await res.json()) as ResponseBody;

			if (res.status === 200) {
				// Aggiorna la lista delle chat
				const chats = await fetch(`${SERVER_API}/chats`);
				const resBody2 = (await chats.json()) as ResponseBody;
				if (res.status === 200) {
					const updatedChats = resBody2.value as Chat[];
					setChatList(updatedChats);

					// Se la chat eliminata era quella attiva
					if (chat.id === activeChat.id) {
						// Se ci sono altre chat, imposta la prima come attiva
						if (updatedChats.length > 0) {
							setActiveChat(updatedChats[0]);
						} else {
							// Se non ci sono altre chat, resetta activeChat
							setActiveChat({} as Chat);
						}
					}
				} else {
					setListMessage("Impossibile eliminare la chat: " + resBody.message);
				}
			} else {
				setListMessage("Impossibile eliminare la chat: " + resBody.message);
			}
		} catch (e) {
			setListMessage("Impossibile raggiungere il server");
		}
	}

	async function handleChatSelection(chat: Chat): Promise<void> {
		try {
			const res = await fetch(`${SERVER_API}/chats`);
			const resBody = (await res.json()) as ResponseBody;
			if (res.status === 200) {
				const chats = resBody.value as Chat[];
				const updatedChat = chats.find((c) => c.id === chat.id);
				if (updatedChat) {
					setActiveChat(updatedChat);
				}
			}
		} catch (e) {
			setChatMessage("Impossibile aggiornare la chat");
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
							onClick={(): void => setAddingChat(true)}
						>
							Nuova chat
						</button>
						{addingChat && (
							<>
								<SearchForm
									onItemClick={(e, user): void => {
										if (user !== loggedUser?.username) {
											addNewChat(e, user);
										}
									}}
									list={[]}
									excludeUser={loggedUser?.username}
								/>
								<button
									className="chat-close-button"
									onClick={(): void => setAddingChat(false)}
								>
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
								<div style={{ display: "flex", gap: "0.5em" }}>
									<button
										className="chat-select-button"
										onClick={(): Promise<void> => handleChatSelection(chat)}
									>
										Chat
									</button>
									<button
										className="chat-select-button"
										style={{ backgroundColor: "red" }}
										onClick={(
											e: React.MouseEvent<HTMLButtonElement>
										): Promise<void> => deleteChat(e, chat)}
									>
										Elimina
									</button>
								</div>
							</div>
						))}
					</div>
					{chatList.length > 0 &&

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
											className={`chat-message ${message.username === loggedUser?.username
												? "message-sent"
												: "message-received"
												}`}
											key={message.id}
											ref={
												index === activeChat.messageList.length - 1
													? lastMessageRef
													: null
											}
										>
											<div className="message-text">{message.text}</div>
											<div
												className="message-info"
												style={{
													display: 'flex',
													justifyContent: 'flex-end',  // Allinea a destra
													gap: '4px'  // Spazio consistente tra gli elementi
												}}
											>
												<span>Da {message.username}</span>
												<span>-</span>
												<span>
													{message.createdAt
														? new Date(message.createdAt).toLocaleTimeString("it-IT", {
															hour: "2-digit",
															minute: "2-digit",
														})
														: "N/A"}
												</span>
											</div>
										</div>
									))}
							</div>
							{/* {chatMessage && (<div className="error-message">{chatMessage}</div>)} */}
							<div className="chat-input-container">
								<input
									className="message-input"
									value={input}
									onChange={(e): void => setInput(e.target.value)}
									onKeyDown={(e): void => {
										if (e.key === 'Enter' && input.trim()) {
											e.preventDefault();
											handleSendMessage();
										}
										// Non blocchiamo altri tasti, permettendo la loro ripetizione naturale
									}}
									autoComplete="off"  // Previene suggerimenti che potrebbero interferire
									style={{
										WebkitUserSelect: 'text',
										userSelect: 'text'
									}}
								/>
								<button
									className="send-button"
									onClick={handleSendMessage}
									disabled={!input}
								>
									Invia
								</button>
							</div>
						</div>
					}
				</div>
			</div>
		</>
	);
}
export default MessageHub;

