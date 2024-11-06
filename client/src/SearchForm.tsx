import React from "react";
import { SERVER_API } from "./params/params";
import { ResponseBody } from "./types/ResponseBody";
// import UserResult from "./types/UserResult";

type SearchFormProps = {
    onItemClick: (
        e: React.ChangeEvent<HTMLSelectElement>,
        user: string
    ) => void;
    list: string[];
};

export default function SearchForm({
    onItemClick,
    list,
}: SearchFormProps): React.JSX.Element {
    const [search, setSearch] = React.useState("");
    const [selectedUsername, setSelectedUsername] = React.useState<
        string | null
    >(null);
    const [searchResults, setSearchResults] = React.useState([] as string[]);

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

    function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>): void {
        const selectedUsername = e.target.value;
        const selectedUser = searchResults.find(
            (user) => user === selectedUsername
        );
        if (selectedUser) {
            setSelectedUsername(selectedUser);
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
                            {selectedUsername
                                ? selectedUsername
                                : "Seleziona un utente"}
                        </option>
                        {searchResults
                            .filter(
                                (username) => !list.find((u) => u === username)
                            )
                            .map((user) => (
                                <option key={user} value={user}>
                                    {user}
                                </option>
                            ))}
                    </select>
                )}
            </div>
        </>
    );
}
