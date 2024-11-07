import React from "react";
import { Routes, Route } from "react-router-dom";
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
import ProjectGantt from "./ProjectGantt";
function App(): React.JSX.Element {
	return (
		<div id="body-container">
			{/* <BrowserRouter> */}
			<WithLayout>
				<Routes>
					<Route path="/">
						<Route index element={<Home />} />
						<Route path="login" element={<Login />} />
						<Route path="calendar" element={<Calendar />} />
						<Route path="pomodoro" element={<Pomodoro />} />
						<Route path="projects" element={<Projects />} />
						<Route path="profile" element={<Profile />} />
						<Route path="notes" element={<Notes />} />
						<Route path="register" element={<Register />} />
						{/* Route notes/new creates the new page for note*/}
						<Route path="chat" element={<MessageHub />} />
						<Route path="notes/:id" element={<NotePage />} />
						<Route path="projects/:id" element={<ProjectPage />} />
						<Route path="projects/:id/gantt" element={<ProjectGantt />} />
						{/* {<Route path="*" element={<Navigate to="/" replace />} />} */}
					</Route>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</WithLayout>
			{/* </BrowserRouter> */}
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
            <div className="global-div">{children}</div>
            <Footer />
        </>
    );
}

export default App;
