import React, { createContext, useState, useContext, useEffect } from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import type User from "./types/User";

interface AuthContextType {
	isLoggedIn: boolean;
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => Promise<void>;
	checkLoginStatus: () => Promise<void>;
	loggedUser: User | undefined;
}

type UserState = {
	loggedIn: boolean;
	loggedUser: User | undefined;
};

const baseUserState: UserState = {
	loggedIn: false,
	loggedUser: undefined,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [userState, setUserState] = useState(baseUserState);

	const checkLoginStatus = async (): Promise<void> => {
		try {
			const res = await fetch(`${SERVER_API}/users/`);
			if (res.status === 200) {
				const resBody = await res.json();
				console.log("Check login status:", resBody.value);
				setUserState({
					loggedUser: resBody.value,
					loggedIn: !!resBody.value,
				});
			} else {
				setUserState({ loggedUser: undefined, loggedIn: false });
			}
		} catch (error) {
			console.error("Error checking login status:", error);
			setUserState({ loggedUser: undefined, loggedIn: false });
		}
	};

	const login = async (username: string, password: string): Promise<boolean> => {
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
					loggedUser: resBody.value,
					loggedIn: !!resBody.value,
				});
				return true;
			} else {
				setUserState({ loggedUser: undefined, loggedIn: false });
				return false;
			}
		} catch (error) {
			console.error("Error during login:", error);
			setUserState({ loggedUser: undefined, loggedIn: false });
			return false;
		}
	};

	const logout = async (): Promise<void> => {
		try {
			const res = await fetch(`${SERVER_API}/users/logout`, {
				method: "POST",
			});

			if (res.status === 200) {
				setUserState({ loggedUser: undefined, loggedIn: false });
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
				loggedUser: userState.loggedUser,
			}}>
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
