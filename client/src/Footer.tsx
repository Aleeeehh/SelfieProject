import React from "react";

function Footer(): React.JSX.Element {
	const currentYear = new Date().getFullYear();

	return (
		<footer>
			<div>Copyright - {currentYear}</div>
		</footer>
	);
}

export default Footer;
