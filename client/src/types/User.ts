type User = {
	id: String;
	username: String;
	password: String;
	firstName: String;
	lastName: String;
	birthday: Date;
	address?: String;
	createdAt?: Date;
	updatedAt?: Date;
};

export default User;
