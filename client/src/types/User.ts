type User = {
	profileImage: string;
	id: string;
	username: string;
	password: string;
	firstName: string;
	lastName: string;
	birthday: Date;
	address?: string;
	createdAt?: Date;
	updatedAt?: Date;
};

export default User;
