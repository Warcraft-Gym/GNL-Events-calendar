export default class TimeUtils {
	public static whichTimeZone(): string {
		if (this.isDST(new Date())) {
			return 'EST';
		}
		return 'EDT';
	}

	private static isDST(date: Date): boolean {
		const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
		const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
		return Math.max(jan, jul) != date.getTimezoneOffset();
	}

	public static async sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
}
