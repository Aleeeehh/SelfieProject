import React from "react";

export default function YouTubePlayer(): React.JSX.Element {
	const [videoUrl, setVideoUrl] = React.useState(`https://www.youtube.com/watch?v=sjkrrmBnpGE`);

	function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>): void {
		setVideoUrl(e.target.value);
	}

	// Estraggo l'ID del video dall'URL YouTube
	const getYouTubeVideoId = (url: string): string | null => {
		const match = url.match(
			/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)|youtu\.be\/([^?&]+)/
		);
		return match ? match[1] || match[2] : null;
	};

	function updateVideo(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();

		const newVideoId = getYouTubeVideoId(videoUrl);
		if (newVideoId) {
			const iframeContainer = document.getElementById(
				"youtube-div-container"
			) as HTMLIFrameElement;

			// Inserisco l'iframe e rimuovo il vecchio iframe
			const iframe = document.createElement("iframe");
			iframeContainer.replaceChildren(iframe);

			iframe.src = `https://www.youtube.com/embed/${newVideoId}`;
		}
	}

	return (
		<div>
			<div>
				<label>
					Inserisci l'URL del video YouTube:
					<input type="text" value={videoUrl} onChange={handleUrlChange} />
				</label>
				<button
					onClick={updateVideo}
					style={{
						border: "0",
						padding: "0.5em 1em",
						borderRadius: "8px",
						backgroundColor: "#4a90e2",
						color: "white",
						fontWeight: "bold",
						cursor: "pointer",
						transition: "background-color 0.3s ease",
					}}
				>
					Play
				</button>
			</div>
			<div id="youtube-div-container" />
		</div>
	);
}
