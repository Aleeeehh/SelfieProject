import React from "react";
import { SERVER_API } from "./lib/params";

type SearchFormProps = {
	onItemClick: (e: React.ChangeEvent<HTMLSelectElement>, user: string) => void;
	list: string[];
};

export default function SearchFormResource({
	onItemClick,
	list,
}: SearchFormProps): React.JSX.Element {
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

		// Acquisisci le risorse: (adesso le acquisisce tutt)
		const res2 = await fetch(`${SERVER_API}/risorsa?name=${e.target.value}`);
		const data = await res2.json();
		const risorse = data.risorse;

		// Per ogni risorsa

		const nomiRisorse: string[] = [];
		for (const risorsa of risorse) {
			nomiRisorse.push(`${risorsa.name} (Risorsa)`);
		}

		console.log(nomiRisorse);
		console.log(nomiRisorse);
		console.log(nomiRisorse);

		const resBody = await res.json();
		const utenti: string[] = resBody.value;

		const combinedResults = [
			...utenti.map((user) => user),
			...nomiRisorse,
		];
		
		setSearchResults(combinedResults);
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
				style={{ margin: "0"}}
				placeholder="Cerca utente/risorsa"
				value={search}
				onChange={handleChange}
			/>
			{searchResults.length > 0 && (
				<select className="search-form-select" onChange={handleSelectChange}>
					<option value="">
						{selectedUsername ? selectedUsername : "Seleziona un utente/risorsa"}
					</option>
					{searchResults
						.filter((username) => !list.find((u) => u === username))
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
