import { Request, Response, Router } from "express";

const router: Router = Router();

router.get("/", (_: Request, res: Response) => {
	res.json({ message: "Hello from the pomodoro router" });
});

export default router;
