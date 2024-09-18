import { ResponseStatus } from "./ResponseStatus";

export type ResponseBody = {
	status: ResponseStatus;
	message?: string;
	value?: JSON | string | number | boolean;
};
