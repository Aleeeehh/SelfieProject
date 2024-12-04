import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { TimeProvider } from "./TimeContext";

// Use createRoot instead of ReactDOM.render
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<TimeProvider>
				<App />
			</TimeProvider>
		</BrowserRouter>
	</StrictMode>
);
