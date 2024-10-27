import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
// import { useNavigate } from "react-router-dom";
import UserResult from "./types/UserResult";
import SearchForm from "./SearchForm";

type Chat = {
    id?: string;
    name?: string;
    userList: UserResult[];
    messageList: string[];
};

function MessageHub(): React.JSX.Element {
    const [activeChat, setActiveChat] = React.useState({} as Chat);
    const [chatList, setChatList] = React.useState([] as Chat[]);
    const [input, setInput] = React.useState("");

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
                    setMessage(
                        "Impossibile recuperare le chat: " + resBody.message
                    );
                }
            } catch (e) {
                setMessage("Impossibile raggiungere il server");
            }
        })();
    }, []);

    async function handleSendMessage(): Promise<void> {
        try {
            const res = await fetch(
                `${SERVER_API}/chats/${activeChat.id}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: input,
                    }),
                }
            );
            const resBody = (await res.json()) as ResponseBody;
            if (res.status === 200) {
                console.log(resBody);
                setInput("");
            }
        } catch (e) {
            setMessage("Impossibile raggiungere il server");
        }
    }

    async function addNewChat(
        e: React.MouseEvent<HTMLButtonElement>,
        user: UserResult
    ): Promise<void> {
        e.preventDefault();

        const res = await fetch(`${SERVER_API}/chats`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userList: [user.id],
            }),
        });

        const resBody = (await res.json()) as ResponseBody;

        if (res.status === 200) {
            console.log(resBody);
            const newChat = resBody.value as Chat;

            setChatList((chatList) => [...chatList, newChat]);
            setActiveChat(newChat);
        }
    }

    return (
        <>
            {message && <div>{message}</div>}
            <div className="chat-list-container">
                {chatList.map((chat) => (
                    <div>
                        <div>{chat.userList.map((user) => user.username)}</div>
                        <button onClick={() => setActiveChat(chat)}>
                            Chat
                        </button>
                    </div>
                ))}
                <SearchForm
                    onItemClick={(
                        e: React.MouseEvent<HTMLButtonElement>,
                        user: UserResult
                    ) => addNewChat(e, user)}
                    list={[]}
                />
            </div>
            <div className="chat-container">
                <div>
                    {/*TODO: separate messages by user*/}

                    {activeChat.messageList.map((message) => (
                        <div>{message}</div>
                    ))}
                </div>
                <div>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button onClick={handleSendMessage} disabled={!input}>
                        Invia
                    </button>
                </div>
            </div>
        </>
    );
}

export default MessageHub;
