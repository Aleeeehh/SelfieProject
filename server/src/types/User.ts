type User = {
	id?: String;
	profileImage: String;
	username: String;
	password: String;
	firstName: String;
	lastName: String;
	birthday: Date;
	address: String;
	createdAt?: Date;
	updatedAt?: Date;
	admin?: Boolean;
};

export default User;

export const profileImages = [
	"avatar-cards.png",
	"avatar-gym.png",
	"avatar-play.png",
	"avatar-reader.png",
	"avatar-runner.png",
	"avatar-writer.png",
];
