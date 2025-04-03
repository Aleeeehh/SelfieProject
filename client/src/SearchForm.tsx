import React from "react";
import { SERVER_API } from "./lib/params";

type SearchFormProps = {
	onItemClick: (e: React.ChangeEvent<HTMLSelectElement>, user: string) => void;
	list: string[];
	excludeUser?: string | null;
};

export default function SearchForm({ onItemClick, list, excludeUser }: SearchFormProps): React.JSX.Element {
	const [search, setSearch] = React.useState("");
	const [selectedUsername, setSelectedUsername] = React.useState<string | null>(null);
	const [searchResults, setSearchResults] = React.useState([] as string[]);

	async function handleChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
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

		const resBody = await res.json();
		const utenti = resBody.value;

		setSearchResults(utenti);
	}

	function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>): void {
		const selectedUsername = e.target.value;
		const selectedUser = searchResults.find((user) => user === selectedUsername);
		if (selectedUser) {
			setSelectedUsername(selectedUser);
			console.log("Utente selezionato:", selectedUser);
			onItemClick(e, selectedUser);
		}
	}

	return (
		<div className="search-form-container">
			<input
				className="search-form-input"
				type="text"
				placeholder="Cerca utente"
				value={search}
				onChange={handleChange}
				style={{ margin: "0" }}
			/>
			{searchResults.length > 0 && (
				<select className="search-form-select" onChange={handleSelectChange} value={selectedUsername || ""}>
					<option value="">
						{selectedUsername ? selectedUsername : "Seleziona un utente"}
					</option>
					{searchResults
						.filter((username) =>
							!list.find((u) => u === username) &&
							(!excludeUser || username !== excludeUser)
						)
						.map((user) => (
							<option key={user} value={user}>
								{user}
							</option>
						))}
				</select>
			)}
		</div>
	);
}
