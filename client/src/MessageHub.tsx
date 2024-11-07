import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
// import { useNavigate } from "react-router-dom";
// import UserResult from "./types/UserResult";
import SearchForm from "./SearchForm";
import type Chat from "./types/Chat";
import { useAuth } from "./AuthContext";
// import Message from "./types/Message";

function MessageHub(): React.JSX.Element {
	const [activeChat, setActiveChat] = React.useState({} as Chat);
	const [chatList, setChatList] = React.useState([] as Chat[]);
	const [input, setInput] = React.useState("");
	const [addingChat, setAddingChat] = React.useState(false);
	const { loggedUser } = useAuth();

	const [message, setMessage] = React.useState("");

	// const nav = useNavigate();

	React.useEffect(() => {
		(async (): Promise<void> => {
			try {
				const res = await fetch(`${SERVER_API}/chats`);
				const resBody = (await res.json()) as ResponseBody;
				if (res.status === 200) {
					setChatList(resBody.value as Chat[]);
					setActiveChat(resBody.value[0]);
				} else {
					setMessage("Impossibile recuperare le chat: " + resBody.message);
				}
			} catch (e) {
				setMessage("Impossibile raggiungere il server");
			}
		})();
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
				console.log(resBody);
				setInput("");
			} else {
				setMessage("Impossibile inviare il messaggio: " + resBody.message);
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
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

				// Get updated chat list

				const chats = await fetch(`${SERVER_API}/chats`);
				const resBody2 = (await chats.json()) as ResponseBody;
				if (res.status === 200) {
					setChatList(resBody2.value as Chat[]);
					setActiveChat(resBody2.value[0]);
				} else {
					setMessage("Impossibile recuperare le chat: " + resBody.message);
				}
			} else {
				setMessage("Impossibile creare la chat: " + resBody.message);
			}
		} catch (e) {
			setMessage("Impossibile raggiungere il server");
		}
	}

	return (
		<>
			{message && <div>{message}</div>}
			<div style={{ display: "flex", flexDirection: "row" }}>
				<div
					className="chat-container"
					style={{
						display: "flex",
						flexDirection: "column",
						width: "50%",
					}}>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							width: "100%",
							minHeight: "1em",
						}}>
						{/*TODO: separate messages by user*/}
						<div>
							{activeChat &&
								activeChat.firstUser &&
								activeChat.secondUser &&
								(activeChat.firstUser === loggedUser?.username
									? activeChat.secondUser
									: activeChat.firstUser)}
						</div>
						{activeChat &&
							activeChat.messageList &&
							activeChat.messageList.map((message) => (
								<div
									style={
										message.username === loggedUser?.username
											? {
													alignSelf: "flex-end",
													backgroundColor: "blue",
											  }
											: {
													alignSelf: "flex-start",
													backgroundColor: "red",
											  }
									}
									key={message.id}>
									<div>{message.text}</div>
									<div>from {message.username}</div>
									<div>at {message.createdAt?.toString()}</div>
								</div>
							))}
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							width: "100%",
						}}>
						<input value={input} onChange={(e): void => setInput(e.target.value)} />
						<button onClick={handleSendMessage} disabled={!input}>
							Invia
						</button>
					</div>
				</div>
				<div
					className="chat-list-container"
					style={{
						display: "flex",
						flexDirection: "column",
						width: "50%",
					}}>
					{chatList.map((chat) => (
						<div style={{ display: "flex", flexDirection: "row" }} key={chat.id}>
							<div style={{ display: "flex", width: "50%" }}>
								{chat.secondUser === loggedUser?.username
									? chat.firstUser
									: chat.secondUser}
							</div>
							<button
								onClick={(): void => setActiveChat(chat)}
								style={{ display: "flex", width: "50%" }}>
								Chat
							</button>
						</div>
					))}
					{addingChat ? (
						<>
							<SearchForm
								onItemClick={(
									e: React.ChangeEvent<HTMLSelectElement>,
									user: string
								): Promise<void> => addNewChat(e, user)}
								list={[]}
							/>
							<button onClick={(): void => setAddingChat(false)}>Chiudi</button>
						</>
					) : (
						<button onClick={(): void => setAddingChat(true)}>
							Crea una nuova chat
						</button>
					)}
				</div>
			</div>
		</>
	);
}

export default MessageHub;
