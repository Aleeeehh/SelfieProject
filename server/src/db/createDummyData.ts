import User from "./User";

// insert fake users if they do not exist
(async () => {
	const dummyUsers = [
		{
			username: "fv1",
			password: "12345678",
		},
		{
			username: "fv2",
			password: "12345678",
		},
		{
			username: "fv3",
			password: "12345678",
		},
		{
			username: "fv4",
			password: "12345678",
		},
		{
			username: "fvPM",
			password: "12345678",
		},
	];
	for (const user of dummyUsers) {
		const foundUser = await User.find({ username: user.username });
		if (!foundUser) {
			await User.create({
				username: user.username,
				password: user.password,
				firstName: "testFName",
				lastName: "testLName",
				birthday: new Date(),
				address: "via falsa 1234",
			});
		}
	}
})();
