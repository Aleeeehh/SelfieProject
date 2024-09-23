// Valid date: YYYY-MM-DD
export function validDateString(dateStr: string) {
	const regex = /^\d{4}-\d{2}-\d{2}$/;
	// TODO: validate also year, month and day values
	return regex.test(dateStr);
}
