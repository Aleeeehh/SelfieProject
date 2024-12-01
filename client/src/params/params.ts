export const SERVER_PORT = 8000;
export const SERVER_API = `http://localhost:${SERVER_PORT}/api`;
// export const SERVER_API = `http://site232402.tw.cs.unibo.it/api`

type ProfileImage = {
	name: string;
	url: string;
};
export const profileImages: ProfileImage[] = [
	{ url: "avatar-cards.png", name: "Cards Sloth" },
	{ url: "avatar-gym.png", name: "Gym Sloth" },
	{ url: "avatar-play.png", name: "Play Sloth" },
	{ url: "avatar-reader.png", name: "Reader Sloth" },
	{ url: "avatar-runner.png", name: "Runner Sloth" },
	{ url: "avatar-writer.png", name: "Writer Sloth" },
];
