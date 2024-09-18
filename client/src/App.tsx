import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./Home";
import Header from "./Header";
import Footer from "./Footer";

function App(): React.JSX.Element {
	return (
		<div id="body-container">
			<BrowserRouter>
				<Routes>
					<Route path="/">
						<Route
							index
							element={
								<WithLayout>
									<Home />
								</WithLayout>
							}
						/>
						<Route path="*" element={<Navigate to="/" replace />} />
					</Route>
				</Routes>
			</BrowserRouter>
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
