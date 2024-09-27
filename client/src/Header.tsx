import React from "react";

export default function Header(): React.JSX.Element {
	return (
		<header className="" style={{ display: "flex", justifyContent: "", margin: "1vw" }}>
			<a href="/" className="header-home">
				<img src="/images/logo.jpeg" alt="logo.jpeg" />
			</a>
			<a className="btn secondary"
				style={{
					backgroundColor: "white",
					color: "black",
					borderColor: "gray",
					marginLeft: "15px"
				}} href="/calendar">
				Calendario
			</a>
			<a className="btn secondary"
				style={{
					backgroundColor: "white",
					color: "black",
					borderColor: "gray",
					marginLeft: "15px"
				}} href="/pomodoro">
				Pomodoro
			</a>
			<a className="btn secondary"
				style={{
					backgroundColor: "white",
					color: "black",
					borderColor: "gray",
					marginLeft: "15px"
				}} href="/notes">
				Note
			</a>
			<a className="btn secondary"
				style={{
					backgroundColor: "white",
					color: "black",
					borderColor: "gray",
					marginLeft: "15px"
				}} href="/projects">
				Progetti
			</a>

		</header>
	);
}
