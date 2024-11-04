import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
import UserResult from "./types/UserResult";

type SearchFormProps = {
    onItemClick: (
        e: React.ChangeEvent<HTMLSelectElement>,
        user: UserResult
    ) => void;
    list: UserResult[];
};

export default function SearchForm({
    onItemClick,
    list,
}: SearchFormProps): React.JSX.Element {
    const [search, setSearch] = React.useState("");
    const [selectedUser, setSelectedUser] = React.useState<UserResult | null>(null);
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

    function handleSelectChange(
        e: React.ChangeEvent<HTMLSelectElement>
    ): void {
        const selectedUserId = e.target.value;
        const selectedUser = searchResults.find((user) => user.id === selectedUserId);
        if (selectedUser) {
            setSelectedUser(selectedUser);
            console.log("Utente selezionato:", selectedUser);
            onItemClick(e, selectedUser);
        }
    }

    return (
        <>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                    style={{ width: "100%", margin: "0 5px" }}
                    type="text"
                    placeholder="Cerca utente"
                    value={search}
                    onChange={handleChange}
                />
                {searchResults.length > 0 && (
                    <select
                        style={{ width: "100%", margin: "0 5px" }}
                        onChange={handleSelectChange}
                    >
                        <option value="">
                            {selectedUser ? selectedUser.username : "Seleziona un utente"}
                        </option>
                        {searchResults
                            .filter((user) => !list.find((u) => u.id === user.id))
                            .map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.username}
                                </option>
                            ))}
                    </select>
                )}
            </div>
        </>
    );
}
