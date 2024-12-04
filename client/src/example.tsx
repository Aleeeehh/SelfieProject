import React from "react";
import { useRefresh } from "./TimeContext";

export default function ServerTime(): React.JSX.Element {
	const { serverTime } = useRefresh();

	React.useEffect(() => {
		console.log("Il tempo è cambiato");
	}, [serverTime]);

	return <>{serverTime}</>;
}
