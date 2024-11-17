import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";

export const checkLoginStatus = async (): Promise<void> => {
    try {
        const res = await fetch(`${SERVER_API}/users/`);
        if (res.status === 200) {
            const resBody = await res.json();
            console.log("Check login status:", resBody.value);

            const id = resBody.value?._id;
            const username = resBody.value?.username;

            localStorage.setItem("loggedUserId", id);
            localStorage.setItem("loggedUserName", username);
        } else {
            console.log("No logged user");
        }
    } catch (error) {
        console.error("Error checking login status:", error);
    }
};

export const login = async (
    username: string,
    password: string
): Promise<boolean> => {
    try {
        const res = await fetch(`${SERVER_API}/users/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (res.status === 200) {
            const resBody = (await res.json()) as ResponseBody;

            console.log(resBody);

            localStorage.setItem("loggedUserId", String(resBody.value._id));
            localStorage.setItem("loggedUserName", String(resBody.value.name));

            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error("Error during login:", error);
        return false;
    }
};

export const logout = async (): Promise<void> => {
    try {
        const res = await fetch(`${SERVER_API}/users/logout`, {
            method: "POST",
        });

        if (res.status === 200) {
            localStorage.removeItem("loggedUserId");
            localStorage.removeItem("loggedUserName");
        }
    } catch (error) {
        console.error("Error during logout:", error);
    }
};
