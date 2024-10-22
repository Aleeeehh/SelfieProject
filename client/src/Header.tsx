import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { SERVER_API } from "./params/params";

const buttonStyle = {
	backgroundColor: "white",
	color: "black",
	borderColor: "gray",
	margin: "auto 0.5em",
	width: "100px",
	alignSelf: "center",
};

const NOTIFICATION_COUNT = 5;

type Notification = {
	userId: string;
	message: string;
	type: string;
	sentAt: Date;
	status: string;
};

export default function Header(): React.JSX.Element {
	const [showNotifications, setShowNotifications] = useState(false);
	const [notifications, setNotifications] = useState([] as Notification[]);
	const { isLoggedIn } = useAuth();

	useEffect(() => {
		fetch(`${SERVER_API}/notifications?count=${NOTIFICATION_COUNT}`)
			.then((res) => res.json())
			.then((data) => {
				console.log(data.value);
				setNotifications(data.value);
			})
			.catch((error) => {
				console.error(error);
			});
	}, []);

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
					<>
						<button
							className="btn secondary"
							style={buttonStyle}
							onClick={(): void => setShowNotifications(!showNotifications)}>
							<i className="fas fa-bell" />
						</button>

						{showNotifications && (
							<div
								style={{
									position: "absolute",
									top: "55px",
									right: "75px",
									backgroundColor: "white",
									border: "1px solid gray",
									padding: "10px",
									zIndex: "1",
								}}>
								{notifications.length > 0 ? (
									notifications.map((notification, index) => (
										<div key={index}>
											<p>{notification.message}</p>
											<p>
												{notification.type} -{" "}
												{notification.sentAt.toString()}
											</p>
										</div>
									))
								) : (
									<div>
										<p>No notifications</p>
									</div>
								)}
							</div>
						)}
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
					</>
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
