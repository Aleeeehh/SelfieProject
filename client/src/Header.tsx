import React from "react";

export default function Header(): React.JSX.Element {
	return (
		<header className="header">
			<a href="/" className="header-home">
				<img src="/images/sloth.png" alt="sloth.png" />
			</a>
			<div className="nav-link-container">
				<a className="nav-link" href="/calendar">
					Calendario
				</a>
				<a className="nav-link" href="/pomodoro">
					Pomodoro
				</a>
				<a className="nav-link" href="/notes">
					Note
				</a>
				<a className="nav-link" href="/projects">
					Progetti
				</a>
			</div>
		</header>
	);
}
