import { ResponseStatus } from "./ResponseStatus.js";

export type ResponseBody = {
	status: ResponseStatus;
	message?: string;
	value?: any; // JSON | string | number | boolean;
};
