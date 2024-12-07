import User from "./types/User.js";

declare global {
	namespace Express {
		interface User {
			id?: string;
		}
	}
}
