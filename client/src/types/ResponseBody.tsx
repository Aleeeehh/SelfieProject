import { ResponseStatus } from "./ResponseStatus.jsx";

export type ResponseBody = {
	status: ResponseStatus;
	message?: string;
	value?: JSON | string | number | boolean;
};
