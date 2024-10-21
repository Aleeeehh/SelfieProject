import React, { createContext, useState, useContext, useEffect } from "react";
import { SERVER_API } from "./params/params";

interface AuthContextType {
	isLoggedIn: boolean;
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => Promise<void>;
	checkLoginStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	const checkLoginStatus = async (): Promise<void> => {
		try {
			const res = await fetch(`${SERVER_API}/users/`);
			if (res.status === 200) {
				const resBody = await res.json();
				console.log(!!resBody.value);
				setIsLoggedIn(!!resBody.value);
			} else {
				setIsLoggedIn(false);
			}
		} catch (error) {
			console.error("Error checking login status:", error);
			setIsLoggedIn(false);
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
				setIsLoggedIn(true);
				return true;
			} else {
				setIsLoggedIn(false);
				return false;
			}
		} catch (error) {
			console.error("Error during login:", error);
			setIsLoggedIn(false);
			return false;
		}
	};

	const logout = async (): Promise<void> => {
		try {
			const res = await fetch(`${SERVER_API}/users/logout`, {
				method: "POST",
			});

			if (res.status === 200) {
				setIsLoggedIn(false);
			}
		} catch (error) {
			console.error("Error during logout:", error);
		}
	};

	useEffect(() => {
		checkLoginStatus();
	}, []);

	return (
		<AuthContext.Provider value={{ isLoggedIn, login, logout, checkLoginStatus }}>
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
