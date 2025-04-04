import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./Home";
import Header from "./Header";
import Footer from "./Footer";
import Calendar from "./Calendar";
import Login from "./Login";
import Pomodoro from "./Pomodoro";
import Projects from "./Projects";
import Notes from "./Notes";
import NotFound from "./NotFound";
import NotePage from "./NotePage";
import Profile from "./Profile";
import Register from "./Register";
import MessageHub from "./MessageHub";
import ProjectPage from "./ProjectPage";
import ActivityPage from "./ActivityPage";
import Activities from "./Activities";
import CreateProjectForm from "./CreateProjectForm";
import CreateActivityForm from "./CreateActivityForm";
import CreateNoteForm from "./CreateNoteForm";

function App(): React.JSX.Element {
	//const isLoggedIn = !!localStorage.getItem("loggedUserId");

	return (
		<div id="body-container">
			<WithLayout>
				<Routes>
					<Route path="/">
						<Route index element={<Home />} />
						<Route path="login" element={<Login />} />
						<Route path="calendar" element={<Calendar />} />
						<Route path="pomodoro" element={<Pomodoro />} />
						<Route path="profile" element={<Profile />} />
						<Route path="register" element={<Register />} />
						<Route path="chat" element={<MessageHub />} />
						<Route path="notes" element={<Notes />} />
						<Route path="notes/new" element={<CreateNoteForm />} />
						<Route path="notes/:id" element={<NotePage />} />
						<Route path="projects" element={<Projects />} />
						<Route path="projects/new" element={<CreateProjectForm />} />
						<Route path="projects/:id" element={<ProjectPage />} />
						<Route path="activities" element={<Activities />} />
						<Route path="activities/new" element={<CreateActivityForm />} />
						<Route path="activities/:id" element={<ActivityPage />} />
					</Route>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</WithLayout>
		</div>
	);
}

interface WithLayoutProps<T extends React.ReactNode> {
	children: T;
}

function WithLayout<T extends React.ReactNode>({
	children,
}: WithLayoutProps<T>): React.JSX.Element {
	const [showChat, setShowChat] = React.useState(false);
	const location = useLocation();
	const isLoggedIn = !!localStorage.getItem("loggedUserId");
	const isLoginPage = location.pathname === "/login" || location.pathname === "/register";

	React.useEffect(() => {
		const handleEsc = (event: KeyboardEvent): void => {
			if (event.key === 'Escape') {
				setShowChat(false);
			}
		};

		window.addEventListener('keydown', handleEsc);

		return () => {
			window.removeEventListener('keydown', handleEsc);
		};
	}, []);

	function toggleChat(): void {
		if (showChat || isLoggedIn) {
			setShowChat(!showChat);
		}
	}

	return (
		<>
			{isLoggedIn && <Header />}
			<div className="global-div">
				{children}

				{showChat && (
					<div
						style={{
							position: 'fixed',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: 'rgba(0, 0, 0, 0.3)',
							zIndex: 999,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center'
						}}
						onClick={(): void => setShowChat(false)}
					>
						<div
							style={{
								display: "block",
								maxWidth: '90%',
								maxHeight: '90vh'
							}}
							onClick={(e): void => e.stopPropagation()}
						>
							<MessageHub />
						</div>
					</div>
				)}

				{isLoggedIn && !isLoginPage && (
					<button
						onClick={toggleChat}
						style={{
							position: "fixed",
							bottom: "20px",
							right: "20px",
							backgroundColor: "#007bff",
							color: "white",
							border: "none",
							borderRadius: "50%",
							width: "60px",
							height: "60px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "20px",
							cursor: "pointer",
							boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
							zIndex: 1000,
						}}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							fill="currentColor"
							className="bi bi-chat"
							viewBox="0 0 16 16">
							<path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105" />
						</svg>
					</button>
				)}
			</div>
			<Footer />
		</>
	);
}

export default App;
