import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

function App(): React.JSX.Element {
	return (
		<div id="body-container">
			<WithLayout>
				<BrowserRouter>
					<Routes>
						<Route path="/">
							<Route index element={<Home />} />
							<Route path="login" element={<Login />} />
							<Route path="calendar" element={<Calendar />} />
							<Route path="pomodoro" element={<Pomodoro />} />
							<Route path="projects" element={<Projects />} />
							<Route path="profile" element={<Profile />} />
							<Route path="notes" element={<Notes />} />
							{/* Route notes/new creates the new page for note*/}
							<Route path="notes/:id" element={<NotePage />} />
							{/* {<Route path="*" element={<Navigate to="/" replace />} />} */}
						</Route>
						<Route path="*" element={<NotFound />} />
					</Routes>
				</BrowserRouter>
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
	return (
		<>
			<Header />
			<hr />
			<div className="global-div">{children}</div>
			<hr />
			<Footer />
		</>
	);
}

export default App;
