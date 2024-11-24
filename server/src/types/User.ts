type User = {
    id?: String;
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
