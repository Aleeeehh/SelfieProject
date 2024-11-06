import React, { createContext, useState, useContext, useEffect } from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";

interface AuthContextType {
    isLoggedIn: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    checkLoginStatus: () => Promise<void>;
    loggedUsername: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [userState, setUserState] = useState({
        loggedIn: false,
        loggedUsername: "",
    });

    const checkLoginStatus = async (): Promise<void> => {
        try {
            const res = await fetch(`${SERVER_API}/users/`);
            if (res.status === 200) {
                const resBody = await res.json();
                console.log("Check login status:", resBody.value);
                setUserState({
                    loggedUsername: resBody.value,
                    loggedIn: !!resBody.value,
                });
            } else {
                setUserState({ loggedUsername: "", loggedIn: false });
            }
        } catch (error) {
            console.error("Error checking login status:", error);
            setUserState({ loggedUsername: "", loggedIn: false });
        }
    };

    const login = async (
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

                setUserState({
                    loggedUsername: resBody.value,
                    loggedIn: !!resBody.value,
                });
                return true;
            } else {
                setUserState({ loggedUsername: "", loggedIn: false });
                return false;
            }
        } catch (error) {
            console.error("Error during login:", error);
            setUserState({ loggedUsername: "", loggedIn: false });
            return false;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            const res = await fetch(`${SERVER_API}/users/logout`, {
                method: "POST",
            });

            if (res.status === 200) {
                setUserState({ loggedUsername: "", loggedIn: false });
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    useEffect(() => {
        checkLoginStatus();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isLoggedIn: userState.loggedIn,
                login,
                logout,
                checkLoginStatus,
                loggedUsername: userState.loggedUsername,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
