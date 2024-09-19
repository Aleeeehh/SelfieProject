import { ResponseStatus } from "./ResponseStatus.js";

export type ResponseBody = {
	status: ResponseStatus;
	message?: string;
	value?: JSON | string | number | boolean;
};
