import React from "react";
import { useState } from "react";

const mp3Files = [
	{ value: "gigi", label: "L'Amour Toujours" },
	{ value: "astronomia", label: "Astronomia" },
	{ value: "acquarium", label: "Acquarium" },
	{ value: "tomato", label: "Tomato" },
	{ value: "dreamland", label: "Dreamland" },
	{ value: "backgrounds", label: "Backgrounds" },
	{ value: "moon", label: "Moon" },
	{ value: "things", label: "Things" },
];

export default function Mp3Player(): React.JSX.Element {
	const [selectedMp3, setSelectedMp3] = useState<string | null>("gigi");

	const handleMp3Select = (mp3: string): void => {
		setSelectedMp3(mp3);
	};

	return (
		<div className="playercontainer">
			<label>
				Scegli che canzone vuoi ascoltare:
				<select
					onChange={(e): void => handleMp3Select(e.target.value)}
					className="mp3dropdown"
					value={selectedMp3 || undefined}
				>
					<option value="">-</option>
					{mp3Files.map((mp3, index) => (
						<option key={"mp3-" + index + "-" + mp3.label} value={mp3.value}>
							{mp3.label}
						</option>
					))}
				</select>
			</label>
			{selectedMp3 && (
				<div className="audioPlayerContainer">
					<audio controls id="audio" key={selectedMp3} className="audioPlayer">
						<source src={"audio/" + selectedMp3 + ".mp3"} type="audio/ogg" />
					</audio>
				</div>
			)}
		</div>
	);
}
