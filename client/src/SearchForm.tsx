import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import UserResult from "./types/UserResult";

type SearchFormProps = {
    onItemClick: (
        e: React.MouseEvent<HTMLButtonElement>,
        user: UserResult
    ) => void;
    list: UserResult[];
};

export default function SearchForm({
    onItemClick,
    list,
}: SearchFormProps): React.JSX.Element {
    const [search, setSearch] = React.useState("");
    const [searchResults, setSearchResults] = React.useState(
        [] as UserResult[]
    );

    async function handleChange(
        e: React.ChangeEvent<HTMLInputElement>
    ): Promise<void> {
        setSearch(e.target.value);

        if (e.target.value === "") {
            setSearchResults([]);
            return;
        }

        const res = await fetch(`${SERVER_API}/users/usernames`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: e.target.value,
            }),
        });

        const resBody = (await res.json()) as ResponseBody;

        console.log(resBody);
        setSearchResults(resBody.value);
    }
    return (
        <>
            <input
                style={{ width: "100%" }}
                type="text"
                placeholder="Search"
                value={search}
                onChange={handleChange}
            />
            {searchResults.length > 0 && (
                <div style={{ width: "100%" }}>
                    {searchResults.map(
                        (user) =>
                            !list.find((u) => u.id === user.id) && (
                                <button
                                    key={user.id}
                                    onClick={(
                                        e: React.MouseEvent<HTMLButtonElement>
                                    ): void => onItemClick(e, user)}
                                >
                                    {user.username}
                                </button>
                            )
                    )}
                </div>
            )}
        </>
    );
}
