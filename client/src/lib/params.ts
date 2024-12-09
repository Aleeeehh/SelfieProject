export const SERVER_PORT = 8000;
//export const SERVER_API = `http://192.168.1.43:${SERVER_PORT}/api`; //per telefono Ale e pc
//export const SERVER_API = `http://localhost:${SERVER_PORT}/api`; //per pc
//export const SERVER_API = `http://site232402.tw.cs.unibo.it/api`
export const SERVER_API = `http://172.20.10.6:${SERVER_PORT}/api`; //per telefono Andre e pc


type ProfileImage = {
	name: string;
	url: string;
};
export const profileImages: ProfileImage[] = [
	{ url: "avatar-cards.png", name: "Pokerista" },
	{ url: "avatar-gym.png", name: "Bodybuilder" },
	{ url: "avatar-play.png", name: "Videogiocatore" },
	{ url: "avatar-reader.png", name: "Lettore" },
	{ url: "avatar-runner.png", name: "Corridore" },
	{ url: "avatar-writer.png", name: "Scrittore" },
	{ url: "avatar-developer.png", name: "Sviluppatore" },
	{ url: "avatar-scacchi.webp", name: "Scacchista" },
	{ url: "avatar-pescatore.webp", name: "Pescatore" },
];
