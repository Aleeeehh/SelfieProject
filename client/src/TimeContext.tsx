import React, { createContext, useContext } from "react";
import { SERVER_API } from "./lib/params";

const TimeContext = createContext({ serverTime: new Date().getTime(), triggerAction: () => {} });

export const TimeProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
	const [serverTime, setServerTime] = React.useState<number>(new Date().getTime());

	console.log(serverTime);

	const triggerAction = (): void => {
		// Perform the action here

		// Set the server time of the context
		fetch(`${SERVER_API}/currentDate`)
			.then((res) => res.json())
			.then((data) => {
				setServerTime(new Date(data.currentDate).getTime());
				console.log(serverTime);
			});
	};

	return (
		<TimeContext.Provider value={{ serverTime, triggerAction }}>
			{children}
		</TimeContext.Provider>
	);
};

export const useRefresh = (): { serverTime: number; triggerAction: () => void } =>
	useContext(TimeContext);
