import React from "react";
import { useAuth } from "./AuthContext";

const buttonStyle = {
	backgroundColor: "white",
	color: "black",
	borderColor: "gray",
	margin: "auto 0.5em",
	width: "100px",
	alignSelf: "center",
};

export default function Header(): React.JSX.Element {
	// const [showMenu, setShowMenu] = useState(false);
	const { isLoggedIn } = useAuth();

	// const toggleMenu = (): void => {
	// 	setShowMenu(!showMenu);
	// };

	// const handleLogout = async (): Promise<void> => {
	// 	await logout();
	// 	setShowMenu(false);
	// };

	return (
		<header
			className=""
			style={{ display: "flex", justifyContent: "space-between", margin: "1vw" }}>
			<a href="/" className="header-home">
				<img src="/images/logo.jpeg" alt="logo.jpeg" />
			</a>
			<div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
				<a className="btn secondary" style={buttonStyle} href="/calendar">
					Calendario
				</a>
				<a className="btn secondary" style={buttonStyle} href="/pomodoro">
					Pomodoro
				</a>
				<a className="btn secondary" style={buttonStyle} href="/notes">
					Note
				</a>
				<a className="btn secondary" style={buttonStyle} href="/projects">
					Progetti
				</a>

				{isLoggedIn ? (
					<div
						style={{
							...buttonStyle,
							display: "flex",
							width: undefined,
							justifyContent: "flex-end",
							alignItems: "center",
						}}>
						<a
							href="/profile"
							style={{
								width: "40px",
								height: "40px",
								borderRadius: "50%",
								backgroundColor: "#007bff",
								border: "none",
								cursor: "pointer",
								alignItems: "center",
								display: "flex",
								justifyContent: "center",
							}}>
							<span style={{ color: "white" }}>U</span>
						</a>
					</div>
				) : (
					<a
						href="/login"
						className="btn secondary"
						style={{ ...buttonStyle, backgroundColor: "green", color: "white" }}>
						Login
					</a>
				)}
			</div>
		</header>
	);
}
