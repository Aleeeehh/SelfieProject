import UserSchema from "./schemas/User.ts";

// Valid date: YYYY-MM-DD
export function validDateString(dateStr: string) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    // TODO: validate also year, month and day values
    return regex.test(dateStr);
}

export async function getUserIdByUsername(username: string) {
    return UserSchema.findOne({ username: username }).then((user) => {
        if (user) {
            return user._id;
        } else {
            throw new Error("User not found");
        }
    });
}
