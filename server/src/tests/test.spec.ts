import mongoose from "mongoose";
import server from "../server.ts";
import request from "supertest";
import { ResponseBody } from "../types/ResponseBody.ts";
import { ResponseStatus } from "../types/ResponseStatus.ts";
import Chat from "../types/Chat.ts";
import Message from "../types/Message.ts";
import UserResult from "../types/UserResult.ts";

jest.useRealTimers();

var dummyChatId: string;
var user1Id: string;
var user2Id: string;
let sessionCookie: string;

beforeAll((done) => {
    (async () => {
        await mongoose.connection.dropDatabase();
    })();
    done();
});

afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    (async () => {
        await mongoose.connection.dropDatabase();
    })();
    done();
});

describe("CHAT API", () => {
    test("1) Create users", async () => {
        return request(server)
            .post("/api/users/register")
            .send({
                username: "test1",
                password: "12345678",
                confirmPassword: "12345678",
                firstName: "testFName",
                lastName: "testLName",
                birthday: new Date().toISOString().split("T")[0],
                address: "via falsa 1234",
            })
            .then((res) => {
                console.log("res", res);
                expect(res.status).toEqual(200);

                const data = res.body as ResponseBody;
                expect(data.status).toEqual(ResponseStatus.GOOD);

                user1Id = data.value as string;

                request(server)
                    .post("/api/users/register")
                    .send({
                        username: "test2",
                        password: "12345678",
                        confirmPassword: "12345678",
                        firstName: "testFName",
                        lastName: "testLName",
                        birthday: new Date().toISOString().split("T")[0],
                        address: "via falsa 1234",
                    })
                    .then((res2) => {
                        console.log("res2", res2.body);

                        expect(res2.status).toEqual(200);

                        const data2 = res2.body as ResponseBody;
                        expect(data2.status).toEqual(ResponseStatus.GOOD);

                        user2Id = data2.value as string;
                    });
            });
    });

    it("2) Login user", async () => {
        const res = await request(server).post("/api/users/login").send({
            username: "test1",
            password: "12345678",
        });
        expect(res.status).toEqual(200);

        const data = (await res.body) as ResponseBody;
        expect(data.status).toEqual(ResponseStatus.GOOD);
        sessionCookie = res.headers["set-cookie"];
    });

    test("3) Get usernames", async () => {
        const getRes = await request(server)
            .post("/api/users/usernames")
            .set("Cookie", sessionCookie)
            .send({
                username: "test",
            });

        expect(getRes.status).toEqual(200);

        const data = getRes.body as ResponseBody;
        console.log(data);
        expect(data.status).toEqual(ResponseStatus.GOOD);
        const users: UserResult[] = data.value;
        expect(users).toHaveLength(2);

        expect(users[0].username).toEqual("test1");
        expect(users[1].username).toEqual("test2");

        user1Id = users[0].id as string;
        user2Id = users[1].id as string;
    });

    it("4) Create chat", async () => {
        const res = await request(server)
            .post("/api/chats")
            .set("Cookie", sessionCookie)
            .send({
                name: "testChat",
                userList: [user1Id, user2Id],
            });
        expect(res.status).toEqual(200);
    });

    it("5) Get chat", async () => {
        const res = await request(server)
            .get("/api/chats/")
            .set("Cookie", sessionCookie)
            .send();
        expect(res.status).toEqual(200);

        const data = (await res.body) as ResponseBody;
        expect(data.status).toEqual(ResponseStatus.GOOD);
        expect(data.value).toHaveLength(1);

        const chat: Chat = data.value[0];

        expect(chat.name).toEqual("testChat");

        const users: UserResult[] = chat.userList;
        expect(users).toHaveLength(2);
        expect(users[0].id).toEqual(user1Id);
        expect(users[0].username).toEqual("test1");

        expect(users[1].id).toEqual(user2Id);
        expect(users[1].username).toEqual("test2");

        dummyChatId = chat.id as string;
    });

    it("6) Create two dummy messages", async () => {
        const res = await request(server)
            .post("/api/chats/messages")
            .set("Cookie", sessionCookie)
            .send({
                chatId: dummyChatId,
                userId: "test1",
                text: "Hello world",
            });

        expect(res.status).toEqual(200);

        const res2 = await request(server)
            .post("/api/chats/messages")
            .set("Cookie", sessionCookie)
            .send({
                chatId: dummyChatId,
                userId: "test2",
                text: "Hello world 2",
            });
        expect(res2.status).toEqual(200);
    });

    it("7) Get messages", async () => {
        const res = await request(server)
            .get("/api/messages/")
            .set("Cookie", sessionCookie)
            .send();
        expect(res.status).toEqual(200);

        const data = (await res.body) as ResponseBody;
        expect(data.status).toEqual(ResponseStatus.GOOD);

        const messages: Message[] = data.value;
        expect(messages.length).toEqual(2);

        expect(messages[0].text).toEqual("Hello world");
        expect(messages[0].userId).toEqual(user1Id);
        expect(messages[1].text).toEqual("Hello world 2");
        expect(messages[1].userId).toEqual(user2Id);
    });
});

/* async function testChat(): Promise<boolean> {
    // Test:
    // 1) create two users
    // 2) create new Chat
    // 3) write a couple of messages
    // 4) delete one user and check the chat
    // 5) delete the chat
    // 6) check if the chat is deleted

    console.log("TEST CHAT");

    const dummyUsers: User[] = [
        {
            id: "",
            username: "test1",
            password: "12345678",
            firstName: "testFName",
            lastName: "testLName",
            birthday: new Date(),
            address: "via falsa 1234",
        },
        {
            id: "",
            username: "test2",
            password: "12345678",
            firstName: "testFName",
            lastName: "testLName",
            birthday: new Date(),
            address: "via falsa 1234",
        },
    ];

    // 1) create two users
    for (const user of dummyUsers) {
        const foundUser = await UserSchema.findOne({
            username: user.username,
        });
        if (!foundUser) {
            const newUser = await UserSchema.create(user);
            console.log("User created for testing chat!");
            user.id = newUser._id.toString();
        } else {
            console.log(
                "User " + user.username + "already present. Should not happen."
            );
            return false;
        }
    }

    // 2) create new Chat
    const chat = {
        id: "",
        name: "testChat",
        users: [dummyUsers[0].id.toString(), dummyUsers[1].id.toString()],
    };

    const foundChat = await ChatSchema.findOne({ name: chat.name });
    if (!foundChat) {
        const newChat = await ChatSchema.create(chat);
        console.log("Chat created for testing chat!");
        chat.id = newChat._id.toString();
    } else {
        console.log("Chat already present. Should not happen.");
        return false;
    }

    // 3) write a couple of messages

    const message1: Message = {
        chatId: chat.id,
        userId: dummyUsers[0].id.toString(),
        text: "Hello world",
    };
    const message2: Message = {
        chatId: chat.id,
        userId: dummyUsers[1].id.toString(),
        text: "Hello world 2",
    };

    const foundMessage1 = await MessageSchema.findOne({ text: message1.text });
    if (!foundMessage1) {
        const newMessage1 = await MessageSchema.create(message1);
        console.log("Message created for testing chat!");
        message1.id = newMessage1._id.toString();
    } else {
        console.log("Message already present. Should not happen.");
        return false;
    }

    const foundMessage2 = await MessageSchema.findOne({ text: message2.text });
    if (!foundMessage2) {
        const newMessage2 = await MessageSchema.create(message2);
        console.log("Message created for testing chat!");
        message2.id = newMessage2._id.toString();
    } else {
        console.log("Message already present. Should not happen.");
        return false;
    }

    // 4) Retrieve the chat and messages

    // 4) delete one user and check the chat
    await UserSchema.findByIdAndDelete(dummyUsers[0].id);
}*/
