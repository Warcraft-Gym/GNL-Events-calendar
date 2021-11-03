export function getMatchId(match: string[]): string {
	return (
		match[4]
			.replace(/[^A-Za-z0-9]/g, '')
			.toLowerCase()
			.substring(0, 7) +
		match[7]
			.replace(/[^A-Za-z0-9]/g, '')
			.toLowerCase()
			.substring(0, 7)
	);
}
